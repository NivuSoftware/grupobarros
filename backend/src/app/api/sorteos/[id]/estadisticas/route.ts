import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { obtenerEstadisticas } from '@/modules/sorteos/sorteos.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await obtenerEstadisticas(id))
  } catch (e) {
    return handleError(e)
  }
}
