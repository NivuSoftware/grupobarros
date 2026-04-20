import pool from '@/lib/db'
import type { PoolClient } from 'pg'
import type { NumeroEspecialDto, EditarNumeroEspecialDto } from './numeros-especiales.schema'

export async function findNumerosBySorteo(sorteoId: string) {
  const { rows } = await pool.query(
    `SELECT ne.*, b.numero AS boleto_numero,
            comp.nombre AS comprador_nombre,
            comp.cedula AS comprador_cedula,
            comp.telefono AS comprador_telefono,
            comp.email AS comprador_email
     FROM numeros_especiales ne
     LEFT JOIN boletos b ON b.id = ne.boleto_ganador_id
     LEFT JOIN compras ca ON ca.id = b.compra_id
     LEFT JOIN compradores comp ON comp.id = ca.comprador_id
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
  const entries: Array<[number, string]> = [
    [-1, 'ORO'], [-2, 'ORO'], [-3, 'ORO'], [-4, 'ORO'], [-5, 'ORO'],
    [-6, 'NARANJA'],
  ]

  const values: unknown[] = []
  const placeholders: string[] = []
  let i = 1

  for (const [numero, tipo] of entries) {
    placeholders.push(`($${i++}, $${i++}, $${i++})`)
    values.push(sorteoId, numero, tipo)
  }

  await client.query(
    `INSERT INTO numeros_especiales (sorteo_id, numero, tipo)
     VALUES ${placeholders.join(', ')}`,
    values,
  )
}

export async function createNumeroEspecial(sorteoId: string, data: NumeroEspecialDto) {
  const { rows } = await pool.query(
    `INSERT INTO numeros_especiales (sorteo_id, numero, tipo, nombre_premio, descripcion, imagen)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sorteoId, data.numero, data.tipo, data.nombrePremio ?? null, data.descripcion ?? null, data.imagen ?? null],
  )
  return rows[0]
}

export async function updateNumeroEspecial(id: string, data: EditarNumeroEspecialDto) {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (data.numero !== undefined)       { fields.push(`numero = $${i++}`);        values.push(data.numero) }
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
