import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { obtenerCompra } from '@/modules/compras/compras.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await obtenerCompra(id))
  } catch (e) {
    return handleError(e)
  }
}
