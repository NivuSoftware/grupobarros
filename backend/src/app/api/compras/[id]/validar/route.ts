import { NextRequest, NextResponse } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { ValidarCompraSchema } from '@/modules/compras/compras.schema'
import { validarCompra } from '@/modules/compras/compras.service'
import { getBearerToken } from '@/lib/auth/http'
import { verifyAccessToken } from '@/lib/auth/tokens'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    let adminId: string
    try {
      const payload = verifyAccessToken(token)
      adminId = payload.sub
    } catch {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const data = ValidarCompraSchema.parse(body)
    const result = await validarCompra(id, data, adminId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
