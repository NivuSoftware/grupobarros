import pool from '@/lib/db'
import type { PoolClient } from 'pg'
import type { NumeroEspecialDto, EditarNumeroEspecialDto } from './numeros-especiales.schema'

export async function findNumerosBySorteo(sorteoId: string) {
  const { rows } = await pool.query(
    `SELECT ne.*,
            -- datos del boleto ganador (si ya se declaró)
            bg.numero AS boleto_numero,
            cg.nombre  AS comprador_nombre,
            cg.cedula  AS comprador_cedula,
            cg.telefono AS comprador_telefono,
            cg.email   AS comprador_email,
            cg.ciudad  AS comprador_ciudad,
            -- boleto actual (puede no ser ganador aún)
            ba.id      AS boleto_actual_id,
            ca2.nombre  AS comprador_actual_nombre,
            ca2.cedula  AS comprador_actual_cedula,
            ca2.telefono AS comprador_actual_telefono,
            ca2.email   AS comprador_actual_email
     FROM numeros_especiales ne
     -- join para ganador ya declarado
     LEFT JOIN boletos bg ON bg.id = ne.boleto_ganador_id
     LEFT JOIN compras  cga ON cga.id = bg.compra_id
     LEFT JOIN compradores cg ON cg.id = cga.comprador_id
     -- join para boleto actual por número (independiente de si es ganador)
     LEFT JOIN boletos ba ON ba.sorteo_id = ne.sorteo_id AND ba.numero = ne.numero
     LEFT JOIN compras  ca ON ca.id = ba.compra_id
     LEFT JOIN compradores ca2 ON ca2.id = ca.comprador_id
     WHERE ne.sorteo_id = $1
     ORDER BY ne.tipo, ne.numero`,
    [sorteoId],
  )
  return rows
}

export async function findNumeroEspecialById(id: string) {
  const { rows } = await pool.query(
    `SELECT * FROM numeros_especiales WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findNumeroEspecialByNumero(sorteoId: string, numero: number) {
  const { rows } = await pool.query(
    `SELECT * FROM numeros_especiales WHERE sorteo_id = $1 AND numero = $2`,
    [sorteoId, numero],
  )
  return rows[0] ?? null
}

export async function crearNumerosEspecialesDefault(
  sorteoId: string,
  client: PoolClient,
) {
  // Placeholders con números negativos únicos (-1..-6) para evitar violar unique(sorteo_id, numero)
  // El admin DEBE asignar números reales (>=0) antes de publicar el sorteo
  const entries: Array<[number, string, string | null]> = [
    [-1, 'ORO', null], [-2, 'ORO', null], [-3, 'ORO', null], [-4, 'ORO', null], [-5, 'ORO', null],
    [-6, 'NARANJA', 'ORANGE'],
  ]

  const values: unknown[] = []
  const placeholders: string[] = []
  let i = 1

  for (const [numero, tipo, color] of entries) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++})`)
    values.push(sorteoId, numero, tipo, color)
  }

  await client.query(
    `INSERT INTO numeros_especiales (sorteo_id, numero, tipo, color)
     VALUES ${placeholders.join(', ')}`,
    values,
  )
}

export async function createNumeroEspecial(sorteoId: string, data: NumeroEspecialDto) {
  const { rows } = await pool.query(
    `INSERT INTO numeros_especiales (sorteo_id, numero, tipo, color, nombre_premio, descripcion, imagen)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [sorteoId, data.numero, data.tipo, data.color ?? null, data.nombrePremio ?? null, data.descripcion ?? null, data.imagen ?? null],
  )
  return rows[0]
}

export async function updateNumeroEspecial(id: string, data: EditarNumeroEspecialDto) {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (data.numero !== undefined)       { fields.push(`numero = $${i++}`);        values.push(data.numero) }
  if (data.color !== undefined)        { fields.push(`color = $${i++}`);         values.push(data.color) }
  if (data.nombrePremio !== undefined) { fields.push(`nombre_premio = $${i++}`); values.push(data.nombrePremio) }
  if (data.descripcion !== undefined)  { fields.push(`descripcion = $${i++}`);   values.push(data.descripcion) }
  if (data.imagen !== undefined)       { fields.push(`imagen = $${i++}`);        values.push(data.imagen) }

  if (fields.length === 0) return findNumeroEspecialById(id)

  values.push(id)
  const { rows } = await pool.query(
    `UPDATE numeros_especiales SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function deleteNumeroEspecial(id: string) {
  await pool.query(`DELETE FROM numeros_especiales WHERE id = $1`, [id])
}

export async function findBoletoByNumeroEspecial(sorteoId: string, numero: number) {
  const { rows } = await pool.query(
    `SELECT b.id, b.numero,
            comp.nombre AS comprador_nombre,
            comp.cedula,
            comp.telefono,
            comp.email
     FROM boletos b
     JOIN compras c ON c.id = b.compra_id
     JOIN compradores comp ON comp.id = c.comprador_id
     WHERE b.sorteo_id = $1 AND b.numero = $2
     LIMIT 1`,
    [sorteoId, numero],
  )
  return rows[0] ?? null
}

export async function marcarGanadorEspecial(
  id: string,
  boletoId: string,
  adminId: string | null,
  client: PoolClient,
) {
  const { rows } = await client.query(
    `UPDATE numeros_especiales
     SET es_ganador = TRUE,
         boleto_ganador_id = $2,
         admin_marcador_id = $3,
         fecha_marcado_ganador = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, boletoId, adminId],
  )
  return rows[0] ?? null
}
