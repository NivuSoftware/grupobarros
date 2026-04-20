import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { AppError } from '@/lib/errors'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const sorteoId = req.nextUrl.searchParams.get('sorteoId')
    const numero = req.nextUrl.searchParams.get('numero')

    if (!sorteoId) throw new AppError('Parámetro sorteoId requerido', 400, 'BAD_REQUEST')

    if (numero !== null) {
      // Buscar boleto específico por número
      const { rows } = await pool.query(
        `SELECT b.*,
                comp.nombre AS comprador_nombre, comp.cedula, comp.telefono, comp.email,
                ne.tipo AS tipo_numero_especial, ne.nombre_premio
         FROM boletos b
         JOIN compras c ON c.id = b.compra_id
         JOIN compradores comp ON comp.id = c.comprador_id
         LEFT JOIN numeros_especiales ne ON ne.id = b.numero_especial_id
         WHERE b.sorteo_id = $1 AND b.numero = $2`,
        [sorteoId, parseInt(numero)],
      )
      return ok(rows[0] ?? null)
    }

    // Listar todos los boletos del sorteo (paginado)
    const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '100'), 500)
    const offset = (page - 1) * limit

    const { rows } = await pool.query(
      `SELECT b.id, b.numero, b.tiene_numero_especial,
              comp.nombre AS comprador_nombre, comp.cedula
       FROM boletos b
       JOIN compras c ON c.id = b.compra_id
       JOIN compradores comp ON comp.id = c.comprador_id
       WHERE b.sorteo_id = $1
       ORDER BY b.numero
       LIMIT $2 OFFSET $3`,
      [sorteoId, limit, offset],
    )

    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM boletos WHERE sorteo_id = $1`,
      [sorteoId],
    )

    return ok({ boletos: rows, total: parseInt(total[0].count), page, limit })
  } catch (e) {
    return handleError(e)
  }
}
