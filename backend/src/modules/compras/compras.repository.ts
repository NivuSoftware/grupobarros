import type { PoolClient } from 'pg'
import pool from '@/lib/db'
import type { CompradorDto } from './compras.schema'

const PRECIO_BOLETO = 2

// ─── Compradores ────────────────────────────────────────────────────────────

export async function upsertComprador(data: CompradorDto, client: PoolClient) {
  const { rows } = await client.query(
    `INSERT INTO compradores (cedula, nombre, telefono, email)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cedula) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           telefono = EXCLUDED.telefono,
           email = EXCLUDED.email
     RETURNING *`,
    [data.cedula, data.nombre, data.telefono, data.email],
  )
  return rows[0]
}

// ─── Compras ─────────────────────────────────────────────────────────────────

export async function createCompra(
  sorteoId: string,
  compradorId: string,
  totalBoletos: number,
  client: PoolClient,
  metodoPago: 'TARJETA' | 'TRANSFERENCIA' = 'TARJETA',
  comprobanteUrl?: string,
) {
  const estadoPago = metodoPago === 'TRANSFERENCIA' ? 'PENDIENTE' : 'VALIDADO'
  const { rows } = await client.query(
    `INSERT INTO compras (sorteo_id, comprador_id, total_boletos, metodo_pago, estado_pago, comprobante_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [sorteoId, compradorId, totalBoletos, metodoPago, estadoPago, comprobanteUrl ?? null],
  )
  return rows[0]
}

// ─── Asignación aleatoria (core del sistema) ─────────────────────────────────

export async function asignarNumerosAleatorios(
  sorteoId: string,
  numeroMax: number,
  cantidad: number,
  client: PoolClient,
): Promise<number[]> {
  // Selecciona N números aleatorios del universo [0..numeroMax] que NO estén vendidos
  // generate_series + EXCEPT garantiza exclusión exacta
  // ORDER BY random() es eficiente para volúmenes normales de rifas
  const { rows } = await client.query(
    `SELECT gs.n AS numero
     FROM generate_series(0, $1) AS gs(n)
     WHERE NOT EXISTS (
       SELECT 1 FROM boletos b
       WHERE b.sorteo_id = $2 AND b.numero = gs.n
     )
     ORDER BY random()
     LIMIT $3`,
    [numeroMax, sorteoId, cantidad],
  )
  return rows.map((r: { numero: number }) => r.numero)
}

// ─── Inserción de boletos con detección de números especiales ─────────────────

export async function insertarBoletos(
  sorteoId: string,
  compraId: string,
  numeros: number[],
  client: PoolClient,
) {
  if (numeros.length === 0) return []

  // Detectar cuáles de estos números son especiales en una sola query
  const { rows: especiales } = await client.query(
    `SELECT id, numero FROM numeros_especiales
     WHERE sorteo_id = $1 AND numero = ANY($2::int[])`,
    [sorteoId, numeros],
  )

  const especialMap = new Map<number, string>(
    especiales.map((e: { id: string; numero: number }) => [e.numero, e.id]),
  )

  // Construir INSERT en batch
  const values: unknown[] = []
  const placeholders: string[] = []
  let i = 1

  for (const numero of numeros) {
    const neId = especialMap.get(numero) ?? null
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`)
    values.push(sorteoId, compraId, numero, neId !== null, neId)
  }

  const { rows } = await client.query(
    `INSERT INTO boletos (sorteo_id, compra_id, numero, tiene_numero_especial, numero_especial_id)
     VALUES ${placeholders.join(', ')}
     RETURNING *`,
    values,
  )

  return rows
}

// ─── Consultas ────────────────────────────────────────────────────────────────

export async function findCompraById(id: string) {
  const { rows } = await pool.query(
    `SELECT c.*, comp.nombre AS comprador_nombre, comp.cedula, comp.telefono, comp.email,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', b.id,
                  'numero', b.numero,
                  'tieneNumeroEspecial', b.tiene_numero_especial,
                  'numeroEspecialId', b.numero_especial_id
                ) ORDER BY b.numero
              ) FILTER (WHERE b.id IS NOT NULL),
              '[]'
            ) AS boletos
     FROM compras c
     JOIN compradores comp ON comp.id = c.comprador_id
     LEFT JOIN boletos b ON b.compra_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, comp.nombre, comp.cedula, comp.telefono, comp.email`,
    [id],
  )
  return rows[0] ?? null
}

export async function findComprasByCedula(cedula: string) {
  const { rows } = await pool.query(
    `SELECT c.*, s.nombre AS sorteo_nombre,
            COUNT(b.id) AS total_boletos
     FROM compras c
     JOIN compradores comp ON comp.id = c.comprador_id
     JOIN sorteos s ON s.id = c.sorteo_id
     LEFT JOIN boletos b ON b.compra_id = c.id
     WHERE comp.cedula = $1
     GROUP BY c.id, s.nombre
     ORDER BY c.creado_en DESC`,
    [cedula],
  )
  return rows
}

export async function findComprasPendientes() {
  const { rows } = await pool.query(
    `SELECT c.*, s.nombre AS sorteo_nombre,
            comp.nombre AS comprador_nombre, comp.cedula, comp.telefono, comp.email
     FROM compras c
     JOIN compradores comp ON comp.id = c.comprador_id
     JOIN sorteos s ON s.id = c.sorteo_id
     WHERE c.estado_pago = 'PENDIENTE'
     ORDER BY c.creado_en ASC`,
  )
  return rows
}

export async function getReporteVentas() {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE c.estado_pago <> 'RECHAZADO')::int AS ventas_realizadas,
       COALESCE(SUM(c.total_boletos) FILTER (WHERE c.estado_pago <> 'RECHAZADO'), 0)::int AS boletos_vendidos,
       COALESCE(SUM(c.total_boletos * $1) FILTER (WHERE c.estado_pago <> 'RECHAZADO'), 0)::numeric AS dinero_esperado,
       COUNT(*) FILTER (WHERE c.metodo_pago = 'TRANSFERENCIA' AND c.estado_pago <> 'RECHAZADO')::int AS ventas_transferencia,
       COUNT(*) FILTER (WHERE c.metodo_pago = 'TARJETA' AND c.estado_pago <> 'RECHAZADO')::int AS ventas_tarjeta,
       COUNT(*) FILTER (WHERE c.estado_pago = 'PENDIENTE')::int AS ventas_pendientes,
       COUNT(*) FILTER (WHERE c.estado_pago = 'RECHAZADO')::int AS ventas_rechazadas
     FROM compras c`,
    [PRECIO_BOLETO],
  )

  const row = rows[0] ?? {}
  return {
    ventas_realizadas: Number(row.ventas_realizadas ?? 0),
    boletos_vendidos: Number(row.boletos_vendidos ?? 0),
    dinero_esperado: Number(row.dinero_esperado ?? 0),
    ventas_transferencia: Number(row.ventas_transferencia ?? 0),
    ventas_tarjeta: Number(row.ventas_tarjeta ?? 0),
    ventas_pendientes: Number(row.ventas_pendientes ?? 0),
    ventas_rechazadas: Number(row.ventas_rechazadas ?? 0),
    precio_boleto: PRECIO_BOLETO,
  }
}

export async function actualizarEstadoCompra(
  id: string,
  accion: 'VALIDADO' | 'RECHAZADO',
  validadoPor: string,
  client: PoolClient,
) {
  const { rows } = await client.query(
    `UPDATE compras
     SET estado_pago = $2, validado_en = NOW(), validado_por = $3
     WHERE id = $1
     RETURNING *`,
    [id, accion, validadoPor],
  )
  return rows[0] ?? null
}
