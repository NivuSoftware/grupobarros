import pool from '@/lib/db'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import {
  findSorteoById,
  setPremioMayorGanador,
  setSorteoEstado,
  verificarCierreAutomatico,
} from '../sorteos/sorteos.repository'
import {
  findNumeroEspecialById,
  marcarGanadorEspecial,
} from '../numeros-especiales/numeros-especiales.repository'

async function findBoleto(boletoId: string, sorteoId: string) {
  const { rows } = await pool.query(
    `SELECT b.*, comp.nombre AS comprador_nombre, comp.cedula, comp.telefono, comp.email
     FROM boletos b
     JOIN compras c ON c.id = b.compra_id
     JOIN compradores comp ON comp.id = c.comprador_id
     WHERE b.id = $1 AND b.sorteo_id = $2`,
    [boletoId, sorteoId],
  )
  return rows[0] ?? null
}

export async function marcarGanadorMayor(
  sorteoId: string,
  boletoId: string,
  adminId: string | null = null,
) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const sorteo = await findSorteoById(sorteoId)
    if (!sorteo) throw new NotFoundError('Sorteo')
    if (!['ACTIVO', 'CERRADO'].includes(sorteo.estado)) {
      throw new ForbiddenError('Solo se puede marcar ganador en sorteos ACTIVOS o CERRADOS')
    }
    if (sorteo.premio_mayor_boleto_id) {
      throw new ConflictError('El premio mayor ya tiene un ganador asignado')
    }

    const boleto = await findBoleto(boletoId, sorteoId)
    if (!boleto) throw new NotFoundError('Boleto (debe pertenecer al sorteo indicado)')

    const sorteoActualizado = await setPremioMayorGanador(sorteoId, boletoId, client)

    // Verificar si corresponde cierre automático
    const debeCerrar = await verificarCierreAutomatico(sorteoId, client)
    let cerradoAutomaticamente = false

    if (debeCerrar && sorteo.estado === 'ACTIVO') {
      await setSorteoEstado(sorteoId, 'CERRADO', client)
      cerradoAutomaticamente = true
    }

    await client.query('COMMIT')

    return {
      sorteo: sorteoActualizado,
      boleto,
      cerradoAutomaticamente,
    }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function marcarGanadorNumeroEspecial(
  numeroEspecialId: string,
  boletoId: string,
  adminId: string | null = null,
) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const ne = await findNumeroEspecialById(numeroEspecialId)
    if (!ne) throw new NotFoundError('Número especial')
    if (ne.es_ganador) throw new ConflictError('Este número especial ya tiene un ganador asignado')

    const sorteo = await findSorteoById(ne.sorteo_id)
    if (!sorteo) throw new NotFoundError('Sorteo')
    if (!['ACTIVO', 'CERRADO'].includes(sorteo.estado)) {
      throw new ForbiddenError('Solo se puede marcar ganador en sorteos ACTIVOS o CERRADOS')
    }

    const boleto = await findBoleto(boletoId, ne.sorteo_id)
    if (!boleto) throw new NotFoundError('Boleto (debe pertenecer al sorteo indicado)')

    // El boleto debe tener exactamente el número del número especial
    if (boleto.numero !== ne.numero) {
      throw new ValidationError(
        `El boleto ${boleto.numero} no corresponde al número especial ${ne.numero}`,
      )
    }

    const neActualizado = await marcarGanadorEspecial(numeroEspecialId, boletoId, adminId, client)

    // Verificar cierre automático
    const debeCerrar = await verificarCierreAutomatico(ne.sorteo_id, client)
    let cerradoAutomaticamente = false

    if (debeCerrar && sorteo.estado === 'ACTIVO') {
      await setSorteoEstado(ne.sorteo_id, 'CERRADO', client)
      cerradoAutomaticamente = true
    }

    await client.query('COMMIT')

    return {
      numeroEspecial: neActualizado,
      boleto,
      cerradoAutomaticamente,
    }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
