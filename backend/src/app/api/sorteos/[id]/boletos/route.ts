import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import pool from '@/lib/db'
import { findSorteoById } from '@/modules/sorteos/sorteos.repository'
import { NotFoundError } from '@/lib/errors'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sorteo = await findSorteoById(id)
    if (!sorteo) throw new NotFoundError('Sorteo')

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
      [id, limit, offset],
    )

    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM boletos WHERE sorteo_id = $1`,
      [id],
    )

    return ok({ boletos: rows, total: parseInt(total[0].count), page, limit })
  } catch (e) {
    return handleError(e)
  }
}
