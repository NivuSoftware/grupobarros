import pool from '@/lib/db'
import type { CrearSorteoDto, EditarSorteoDto } from './sorteos.schema'

export async function findAllSorteos(estado?: string) {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM boletos bv WHERE bv.sorteo_id = s.id) AS boletos_vendidos,
       CASE WHEN b.id IS NULL THEN NULL ELSE json_build_object(
         'id', b.id,
         'numero', b.numero,
         'tiene_numero_especial', b.tiene_numero_especial,
         'comprador_nombre', comp.nombre,
         'cedula', comp.cedula,
         'telefono', comp.telefono,
         'email', comp.email,
         'ciudad', comp.ciudad
       ) END AS premio_mayor_boleto
     FROM sorteos s
     LEFT JOIN boletos b ON b.id = s.premio_mayor_boleto_id
     LEFT JOIN compras c ON c.id = b.compra_id
     LEFT JOIN compradores comp ON comp.id = c.comprador_id
     ${estado ? 'WHERE s.estado = $1' : ''}
     ORDER BY s.creado_en DESC`,
    estado ? [estado] : [],
  )
  return rows
}

export async function findSorteoById(id: string) {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM boletos bv WHERE bv.sorteo_id = s.id) AS boletos_vendidos,
       CASE WHEN b.id IS NULL THEN NULL ELSE json_build_object(
         'id', b.id,
         'numero', b.numero,
         'tiene_numero_especial', b.tiene_numero_especial,
         'comprador_nombre', comp.nombre,
         'cedula', comp.cedula,
         'telefono', comp.telefono,
         'email', comp.email,
         'ciudad', comp.ciudad
       ) END AS premio_mayor_boleto
     FROM sorteos s
     LEFT JOIN boletos b ON b.id = s.premio_mayor_boleto_id
     LEFT JOIN compras c ON c.id = b.compra_id
     LEFT JOIN compradores comp ON comp.id = c.comprador_id
     WHERE s.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findSorteoActivo() {
  const { rows } = await pool.query(
    `SELECT * FROM sorteos WHERE estado = 'ACTIVO' LIMIT 1`,
  )
  return rows[0] ?? null
}

export async function createSorteo(data: CrearSorteoDto) {
  const { rows } = await pool.query(
    `INSERT INTO sorteos (
       nombre, descripcion, numero_maximo_boletos,
       premio_mayor_nombre, premio_mayor_descripcion, premio_mayor_imagenes
     ) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.nombre,
      data.descripcion ?? null,
      data.numeroMaximoBoletos,
      data.premioMayorNombre,
      data.premioMayorDescripcion ?? null,
      data.premioMayorImagenes,
    ],
  )
  return rows[0]
}

export async function updateSorteo(id: string, data: EditarSorteoDto) {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (data.nombre !== undefined)               { fields.push(`nombre = $${i++}`);                     values.push(data.nombre) }
  if (data.descripcion !== undefined)          { fields.push(`descripcion = $${i++}`);                values.push(data.descripcion) }
  if (data.numeroMaximoBoletos !== undefined)  { fields.push(`numero_maximo_boletos = $${i++}`);      values.push(data.numeroMaximoBoletos) }
  if (data.premioMayorNombre !== undefined)    { fields.push(`premio_mayor_nombre = $${i++}`);        values.push(data.premioMayorNombre) }
  if (data.premioMayorDescripcion !== undefined){ fields.push(`premio_mayor_descripcion = $${i++}`);  values.push(data.premioMayorDescripcion) }
  if (data.premioMayorImagenes !== undefined)  { fields.push(`premio_mayor_imagenes = $${i++}`);      values.push(data.premioMayorImagenes) }

  if (fields.length === 0) return findSorteoById(id)

  values.push(id)
  const { rows } = await pool.query(
    `UPDATE sorteos SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function setSorteoEstado(
  id: string,
  estado: 'ACTIVO' | 'CERRADO',
  client?: import('pg').PoolClient,
) {
  const q = client ?? pool
  const cerradoEn = estado === 'CERRADO' ? 'NOW()' : 'NULL'
  const { rows } = await q.query(
    `UPDATE sorteos SET estado = $1, cerrado_en = ${cerradoEn}
     WHERE id = $2 RETURNING *`,
    [estado, id],
  )
  return rows[0] ?? null
}

export async function cerrarSorteoActivo(client: import('pg').PoolClient) {
  await client.query(
    `UPDATE sorteos SET estado = 'CERRADO', cerrado_en = NOW()
     WHERE estado = 'ACTIVO'`,
  )
}

export async function setPremioMayorGanador(
  sorteoId: string,
  boletoId: string,
  client: import('pg').PoolClient,
) {
  const { rows } = await client.query(
    `UPDATE sorteos SET premio_mayor_boleto_id = $1
     WHERE id = $2 RETURNING *`,
    [boletoId, sorteoId],
  )
  return rows[0] ?? null
}

export async function deleteSorteo(id: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Desvincular boleto ganador de números especiales
    await client.query(
      `UPDATE numeros_especiales SET boleto_ganador_id = NULL WHERE sorteo_id = $1`,
      [id],
    )
    // Desvincular premio mayor del sorteo
    await client.query(
      `UPDATE sorteos SET premio_mayor_boleto_id = NULL WHERE id = $1`,
      [id],
    )
    // Desvincular número especial de boletos
    await client.query(
      `UPDATE boletos SET numero_especial_id = NULL WHERE sorteo_id = $1`,
      [id],
    )
    await client.query(`DELETE FROM numeros_especiales WHERE sorteo_id = $1`, [id])
    await client.query(`DELETE FROM boletos WHERE sorteo_id = $1`, [id])
    await client.query(`DELETE FROM compras WHERE sorteo_id = $1`, [id])
    await client.query(`DELETE FROM sorteos WHERE id = $1`, [id])
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function verificarCierreAutomatico(
  sorteoId: string,
  client: import('pg').PoolClient,
): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT
       (s.premio_mayor_boleto_id IS NOT NULL) AS mayor_ok,
       COALESCE(
         (SELECT COUNT(*) FROM numeros_especiales ne
          WHERE ne.sorteo_id = s.id AND ne.es_ganador = FALSE) = 0,
         TRUE
       ) AS especiales_ok
     FROM sorteos s
     WHERE s.id = $1`,
    [sorteoId],
  )
  const row = rows[0]
  return row?.mayor_ok === true && row?.especiales_ok === true
}
