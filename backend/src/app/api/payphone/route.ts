import { NextRequest } from 'next/server'
import { ok, created, handleError } from '@/lib/response'
import { INTERNATIONAL_PHONE_REGEX } from '@/lib/phone'
import { z } from 'zod'
import { iniciarPagoPayphone, confirmarPagoPayphone } from '@/modules/payphone/payphone.service'

const IniciarSchema = z.object({
  sorteoId: z.string().uuid(),
  cantidadBoletos: z.number().int().min(1),
  comprador: z.object({
    nombre: z.string().min(2).max(120),
    cedula: z.string().regex(/^\d{10}$/),
    telefono: z.string().regex(INTERNATIONAL_PHONE_REGEX),
    email: z.string().email(),
    direccion: z.string().min(5).max(300).optional(),
  }),
})

const ConfirmarSchema = z.object({
  transactionId: z.number().int(),
  clientTransactionId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl
    const action = url.searchParams.get('action')

    if (action === 'confirmar') {
      const body = await req.json()
      const data = ConfirmarSchema.parse(body)
      const result = await confirmarPagoPayphone(data.transactionId, data.clientTransactionId)
      return ok(result)
    }

    // action === 'iniciar' (default)
    const body = await req.json()
    const data = IniciarSchema.parse(body)
    const result = await iniciarPagoPayphone(data)
    return created(result)
  } catch (e) {
    return handleError(e)
  }
}
