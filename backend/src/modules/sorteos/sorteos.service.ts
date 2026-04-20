import pool from '@/lib/db'
import { ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors'
import {
  findAllSorteos,
  findSorteoById,
  createSorteo,
  updateSorteo,
  cerrarSorteoActivo,
  setSorteoEstado,
  deleteSorteo,
} from './sorteos.repository'
import type { CrearSorteoDto, EditarSorteoDto } from './sorteos.schema'
import { crearNumerosEspecialesDefault } from '../numeros-especiales/numeros-especiales.repository'

export async function listarSorteos(estado?: string) {
  return findAllSorteos(estado)
}

export async function obtenerSorteo(id: string) {
  const sorteo = await findSorteoById(id)
  if (!sorteo) throw new NotFoundError('Sorteo')
  return sorteo
}

export async function crearSorteo(data: CrearSorteoDto) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const sorteo = await createSorteo(data)

    // Crear números especiales por defecto: 5 ORO + 1 NARANJA con numero = 0 (placeholder)
    await crearNumerosEspecialesDefault(sorteo.id, client)

    await client.query('COMMIT')
    return sorteo
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function editarSorteo(id: string, data: EditarSorteoDto) {
  const sorteo = await findSorteoById(id)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se puede editar un sorteo en estado DRAFT')

  return updateSorteo(id, data)
}

export async function publicarSorteo(id: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const sorteo = await findSorteoById(id)
    if (!sorteo) throw new NotFoundError('Sorteo')
    if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se puede publicar un sorteo en estado DRAFT')

    // Verificar que todos los números especiales tienen números válidos (>= 0 y dentro del rango)
    const { rows: ne } = await client.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE numero >= 0 AND numero <= $2) AS configurados
       FROM numeros_especiales WHERE sorteo_id = $1`,
      [id, sorteo.numero_maximo_boletos],
    )
    if (parseInt(ne[0].configurados) !== parseInt(ne[0].total)) {
      throw new ForbiddenError(
        'Todos los números especiales deben tener números válidos dentro del rango del sorteo antes de publicar',
      )
    }

    // Verificar números especiales no duplicados (cubierto por unique constraint)
    // Cerrar sorteo activo anterior si existe
    await cerrarSorteoActivo(client)

    // Activar este sorteo
    const updated = await setSorteoEstado(id, 'ACTIVO', client)

    await client.query('COMMIT')
    return updated
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function eliminarSorteo(id: string) {
  const sorteo = await findSorteoById(id)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se puede eliminar un sorteo en estado DRAFT')
  await deleteSorteo(id)
}

export async function cerrarSorteoManual(id: string) {
  const sorteo = await findSorteoById(id)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'ACTIVO') throw new ForbiddenError('Solo se puede cerrar un sorteo ACTIVO')

  return setSorteoEstado(id, 'CERRADO')
}

export async function obtenerEstadisticas(id: string) {
  const sorteo = await findSorteoById(id)
  if (!sorteo) throw new NotFoundError('Sorteo')

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS vendidos,
       ($1 + 1) - COUNT(*) AS disponibles,
       ROUND(COUNT(*) * 100.0 / ($1 + 1), 2) AS porcentaje_vendido
     FROM boletos WHERE sorteo_id = $2`,
    [sorteo.numero_maximo_boletos, id],
  )

  return {
    sorteo,
    estadisticas: {
      totalBoletos: sorteo.numero_maximo_boletos + 1,
      vendidos: parseInt(rows[0].vendidos),
      disponibles: parseInt(rows[0].disponibles),
      porcentajeVendido: parseFloat(rows[0].porcentaje_vendido ?? '0'),
    },
  }
}
