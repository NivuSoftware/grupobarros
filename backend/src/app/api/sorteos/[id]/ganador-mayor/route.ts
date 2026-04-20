import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { MarcarGanadorMayorSchema } from '@/modules/ganadores/ganadores.schema'
import { marcarGanadorMayor } from '@/modules/ganadores/ganadores.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { boletoId } = MarcarGanadorMayorSchema.parse(body)
    // adminId puede venir del JWT en producción; por ahora null
    return ok(await marcarGanadorMayor(id, boletoId, null))
  } catch (e) {
    return handleError(e)
  }
}
