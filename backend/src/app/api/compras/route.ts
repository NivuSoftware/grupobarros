import { NextRequest, NextResponse } from 'next/server'
import { ok, created, handleError } from '@/lib/response'
import { CompraSchema } from '@/modules/compras/compras.schema'
import {
  realizarCompra,
  buscarComprasPorCedula,
  listarComprasPendientes,
  obtenerReporteVentas,
} from '@/modules/compras/compras.service'
import { getBearerToken } from '@/lib/auth/http'
import { verifyAccessToken } from '@/lib/auth/tokens'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CompraSchema.parse(body)
    const result = await realizarCompra(data)
    return created(result)
  } catch (e) {
    return handleError(e)
  }
}

export async function GET(req: NextRequest) {
  try {
    const cedula = req.nextUrl.searchParams.get('cedula')
    const pendientes = req.nextUrl.searchParams.get('pendientes')
    const sorteoId = req.nextUrl.searchParams.get('sorteoId') ?? undefined
    const reporte = req.nextUrl.searchParams.get('reporte')

    if (pendientes === '1' || reporte === 'ventas') {
      const token = getBearerToken(req)
      if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      try {
        verifyAccessToken(token)
      } catch {
        return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 })
      }
      if (reporte === 'ventas') return ok(await obtenerReporteVentas(sorteoId))
      return ok(await listarComprasPendientes(sorteoId))
    }

    if (!cedula) {
      return handleError(
        Object.assign(new Error('Parámetro cedula requerido'), { statusCode: 400, code: 'BAD_REQUEST' }),
      )
    }
    return ok(await buscarComprasPorCedula(cedula))
  } catch (e) {
    return handleError(e)
  }
}
