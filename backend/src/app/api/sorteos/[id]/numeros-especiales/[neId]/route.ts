import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/response'
import { EditarNumeroEspecialSchema } from '@/modules/numeros-especiales/numeros-especiales.schema'
import {
  editarNumeroEspecial,
  eliminarNumeroEspecial,
} from '@/modules/numeros-especiales/numeros-especiales.service'

type Ctx = { params: Promise<{ id: string; neId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id, neId } = await params
    const body = await req.json()
    const data = EditarNumeroEspecialSchema.parse(body)
    return ok(await editarNumeroEspecial(id, neId, data))
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id, neId } = await params
    await eliminarNumeroEspecial(id, neId)
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
}
