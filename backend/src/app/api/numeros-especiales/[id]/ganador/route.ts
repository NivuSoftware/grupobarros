import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { marcarGanadorNumeroEspecial } from '@/modules/ganadores/ganadores.service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await marcarGanadorNumeroEspecial(id, null))
  } catch (e) {
    return handleError(e)
  }
}
