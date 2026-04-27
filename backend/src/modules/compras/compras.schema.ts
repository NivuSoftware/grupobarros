import { z } from 'zod'
import { INTERNATIONAL_PHONE_MESSAGE, INTERNATIONAL_PHONE_REGEX } from '@/lib/phone'

export const CompradorSchema = z.object({
  nombre: z.string().min(2).max(120),
  cedula: z.string().regex(/^\d{10}$/, 'La cédula debe tener exactamente 10 dígitos'),
  telefono: z.string().regex(INTERNATIONAL_PHONE_REGEX, INTERNATIONAL_PHONE_MESSAGE),
  email: z.string().email('Email inválido'),
  direccion: z.string().min(5).max(300).optional(),
  ciudad: z.string().min(2).max(100).optional(),
})

export const CompraSchema = z.object({
  sorteoId: z.string().uuid('sorteoId debe ser un UUID válido'),
  cantidadBoletos: z.number().int().min(1, 'Debes comprar al menos 1 boleto'),
  comprador: CompradorSchema,
  metodoPago: z.enum(['TARJETA', 'TRANSFERENCIA']).default('TARJETA'),
  comprobanteUrl: z.string().min(1).optional(),
})

export const ValidarCompraSchema = z.object({
  accion: z.enum(['VALIDADO', 'RECHAZADO']),
})

export type CompraDto = z.infer<typeof CompraSchema>
export type CompradorDto = z.infer<typeof CompradorSchema>
export type ValidarCompraDto = z.infer<typeof ValidarCompraSchema>
