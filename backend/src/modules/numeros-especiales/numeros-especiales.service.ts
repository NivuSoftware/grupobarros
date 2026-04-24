import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { findSorteoById } from '../sorteos/sorteos.repository'
import {
  findNumerosBySorteo,
  findNumeroEspecialById,
  findNumeroEspecialByNumero,
  createNumeroEspecial,
  updateNumeroEspecial,
  deleteNumeroEspecial,
} from './numeros-especiales.repository'
import type { NumeroEspecialColor, NumeroEspecialDto, EditarNumeroEspecialDto } from './numeros-especiales.schema'

function resolveNumeroEspecialColor(
  tipo: 'ORO' | 'NARANJA',
  color?: NumeroEspecialColor,
) {
  if (tipo !== 'NARANJA') return undefined
  return color ?? 'ORANGE'
}

export async function listarNumerosEspeciales(sorteoId: string) {
  const sorteo = await findSorteoById(sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  return findNumerosBySorteo(sorteoId)
}

export async function agregarNumeroEspecial(sorteoId: string, data: NumeroEspecialDto) {
  const sorteo = await findSorteoById(sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se pueden configurar números especiales en estado DRAFT')

  if (data.numero > sorteo.numero_maximo_boletos) {
    throw new ValidationError(
      `El número ${data.numero} excede el rango máximo del sorteo (${sorteo.numero_maximo_boletos})`,
    )
  }

  const existente = await findNumeroEspecialByNumero(sorteoId, data.numero)
  if (existente) throw new ConflictError(`El número ${data.numero} ya está registrado como número especial`)

  return createNumeroEspecial(sorteoId, {
    ...data,
    color: resolveNumeroEspecialColor(data.tipo, data.color),
  })
}

export async function editarNumeroEspecial(
  sorteoId: string,
  neId: string,
  data: EditarNumeroEspecialDto,
) {
  const sorteo = await findSorteoById(sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se pueden editar números especiales en estado DRAFT')

  const ne = await findNumeroEspecialById(neId)
  if (!ne || ne.sorteo_id !== sorteoId) throw new NotFoundError('Número especial')

  if (data.numero !== undefined) {
    if (data.numero > sorteo.numero_maximo_boletos) {
      throw new ValidationError(
        `El número ${data.numero} excede el rango máximo del sorteo (${sorteo.numero_maximo_boletos})`,
      )
    }
    const existente = await findNumeroEspecialByNumero(sorteoId, data.numero)
    if (existente && existente.id !== neId) {
      throw new ConflictError(`El número ${data.numero} ya está registrado como número especial`)
    }
  }

  return updateNumeroEspecial(neId, {
    ...data,
    color: data.color !== undefined ? resolveNumeroEspecialColor(ne.tipo, data.color) : undefined,
  })
}

export async function eliminarNumeroEspecial(sorteoId: string, neId: string) {
  const sorteo = await findSorteoById(sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'DRAFT') throw new ForbiddenError('Solo se pueden eliminar números especiales en estado DRAFT')

  const ne = await findNumeroEspecialById(neId)
  if (!ne || ne.sorteo_id !== sorteoId) throw new NotFoundError('Número especial')

  await deleteNumeroEspecial(neId)
}
