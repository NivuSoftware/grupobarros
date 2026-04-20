import { z } from 'zod'

export const CompradorSchema = z.object({
  nombre: z.string().min(2).max(120),
  cedula: z.string().regex(/^\d{10}$/, 'La cédula debe tener exactamente 10 dígitos'),
  telefono: z.string().regex(/^(\+593|0)\d{9}$/, 'Teléfono inválido (formato: 0999999999 o +593999999999)'),
  email: z.string().email('Email inválido'),
})

export const CompraSchema = z.object({
  sorteoId: z.string().uuid('sorteoId debe ser un UUID válido'),
  cantidadBoletos: z.number().int().min(3, 'La compra mínima es de 3 boletos'),
  comprador: CompradorSchema,
  metodoPago: z.enum(['TARJETA', 'TRANSFERENCIA']).default('TARJETA'),
  comprobanteUrl: z.string().url('URL de comprobante inválida').optional(),
})

export const ValidarCompraSchema = z.object({
  accion: z.enum(['VALIDADO', 'RECHAZADO']),
})

export type CompraDto = z.infer<typeof CompraSchema>
export type CompradorDto = z.infer<typeof CompradorSchema>
export type ValidarCompraDto = z.infer<typeof ValidarCompraSchema>
