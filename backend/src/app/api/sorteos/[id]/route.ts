import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { EditarSorteoSchema } from '@/modules/sorteos/sorteos.schema'
import { obtenerSorteo, editarSorteo, eliminarSorteo } from '@/modules/sorteos/sorteos.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await obtenerSorteo(id))
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = EditarSorteoSchema.parse(body)
    return ok(await editarSorteo(id, data))
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await eliminarSorteo(id)
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
