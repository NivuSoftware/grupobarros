import { z } from 'zod'

export const MarcarGanadorMayorSchema = z.object({
  boletoId: z.string().uuid('boletoId debe ser un UUID válido'),
})

export const MarcarGanadorEspecialSchema = z.object({
  boletoId: z.string().uuid('boletoId debe ser un UUID válido'),
})

export type MarcarGanadorMayorDto = z.infer<typeof MarcarGanadorMayorSchema>
export type MarcarGanadorEspecialDto = z.infer<typeof MarcarGanadorEspecialSchema>
