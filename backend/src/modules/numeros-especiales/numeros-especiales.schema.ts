import { z } from 'zod'

export const NumeroEspecialColorSchema = z.enum(['ORANGE', 'BLACK', 'GREEN', 'BLUE', 'RED'])

export const NumeroEspecialSchema = z.object({
  numero: z.number().int().min(0),
  tipo: z.enum(['ORO', 'NARANJA']),
  color: NumeroEspecialColorSchema.optional(),
  nombrePremio: z.string().max(100).optional(),
  descripcion: z.string().max(500).optional(),
  imagen: z.string().url().optional(),
})

export const EditarNumeroEspecialSchema = z.object({
  numero: z.number().int().min(0).optional(),
  color: NumeroEspecialColorSchema.optional(),
  nombrePremio: z.string().max(100).optional(),
  descripcion: z.string().max(500).optional(),
  imagen: z.string().url().optional(),
})

export type NumeroEspecialDto = z.infer<typeof NumeroEspecialSchema>
export type EditarNumeroEspecialDto = z.infer<typeof EditarNumeroEspecialSchema>
export type NumeroEspecialColor = z.infer<typeof NumeroEspecialColorSchema>
