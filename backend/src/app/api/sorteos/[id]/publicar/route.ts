import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { publicarSorteo } from '@/modules/sorteos/sorteos.service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await publicarSorteo(id))
  } catch (e) {
    return handleError(e)
  }
}
