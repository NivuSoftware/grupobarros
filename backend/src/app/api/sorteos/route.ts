import { NextRequest } from 'next/server'
import { ok, created, handleError } from '@/lib/response'
import { CrearSorteoSchema } from '@/modules/sorteos/sorteos.schema'
import { listarSorteos, crearSorteo } from '@/modules/sorteos/sorteos.service'

export async function GET(req: NextRequest) {
  try {
    const estado = req.nextUrl.searchParams.get('estado') ?? undefined
    const sorteos = await listarSorteos(estado)
    return ok(sorteos)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CrearSorteoSchema.parse(body)
    const sorteo = await crearSorteo(data)
    return created(sorteo)
  } catch (e) {
    return handleError(e)
  }
}
