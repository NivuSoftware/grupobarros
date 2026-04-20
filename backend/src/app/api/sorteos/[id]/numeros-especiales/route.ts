import { NextRequest } from 'next/server'
import { ok, created, handleError } from '@/lib/response'
import { NumeroEspecialSchema } from '@/modules/numeros-especiales/numeros-especiales.schema'
import {
  listarNumerosEspeciales,
  agregarNumeroEspecial,
} from '@/modules/numeros-especiales/numeros-especiales.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return ok(await listarNumerosEspeciales(id))
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = NumeroEspecialSchema.parse(body)
    return created(await agregarNumeroEspecial(id, data))
  } catch (e) {
    return handleError(e)
  }
}
