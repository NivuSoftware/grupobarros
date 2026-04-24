import { z } from 'zod'

export const CrearSorteoSchema = z.object({
  nombre: z.string().min(3).max(100),
  descripcion: z.string().max(500).optional(),
  numeroMaximoBoletos: z.number().int().min(9).max(999999),
  premioMayorNombre: z.string().min(3).max(100),
  premioMayorDescripcion: z.string().max(500).optional(),
  premioMayorImagenes: z.array(z.string().min(1)).max(5).default([]),
})

export const EditarSorteoSchema = z.object({
  nombre: z.string().min(3).max(100).optional(),
  descripcion: z.string().max(500).optional(),
  numeroMaximoBoletos: z.number().int().min(9).max(999999).optional(),
  premioMayorNombre: z.string().min(3).max(100).optional(),
  premioMayorDescripcion: z.string().max(500).optional(),
  premioMayorImagenes: z.array(z.string().min(1)).max(5).optional(),
})

export type CrearSorteoDto = z.infer<typeof CrearSorteoSchema>
export type EditarSorteoDto = z.infer<typeof EditarSorteoSchema>
