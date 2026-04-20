import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { MarcarGanadorEspecialSchema } from '@/modules/ganadores/ganadores.schema'
import { marcarGanadorNumeroEspecial } from '@/modules/ganadores/ganadores.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { boletoId } = MarcarGanadorEspecialSchema.parse(body)
    return ok(await marcarGanadorNumeroEspecial(id, boletoId, null))
  } catch (e) {
    return handleError(e)
  }
}
