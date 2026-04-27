import pool from '@/lib/db'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { sendPurchaseConfirmationEmail, sendTransferenciaPendienteEmail } from '@/lib/mail'
import { getTicketQuantityValidationError } from '@/lib/ticket-quantity'
import { emitirFactura } from '@/lib/contifico'
import { findSorteoById } from '../sorteos/sorteos.repository'
import {
  upsertComprador,
  createCompra,
  asignarNumerosAleatorios,
  insertarBoletos,
  findCompraById,
  findComprasByCedula,
  findComprasPendientes,
  getReporteVentas,
  actualizarEstadoCompra,
} from './compras.repository'
import type { CompraDto, ValidarCompraDto } from './compras.schema'

const MAX_REINTENTOS = 3

export async function realizarCompra(data: CompraDto) {
  const sorteo = await findSorteoById(data.sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'ACTIVO') {
    throw new ForbiddenError('No se pueden comprar boletos en este momento. El sorteo no está activo.')
  }

  if (data.metodoPago === 'TRANSFERENCIA' && !data.comprobanteUrl) {
    throw new ValidationError('Debes adjuntar el comprobante de transferencia bancaria.')
  }

  // Disponibilidad = máximo + 1 - boletos ya asignados - boletos reservados por compras PENDIENTE
  const { rows: dispCheck } = await pool.query(
    `SELECT ($1 + 1)
       - (SELECT COUNT(*) FROM boletos WHERE sorteo_id = $2)
       - (SELECT COALESCE(SUM(total_boletos), 0) FROM compras
          WHERE sorteo_id = $2 AND estado_pago = 'PENDIENTE')
     AS disponibles`,
    [sorteo.numero_maximo_boletos, data.sorteoId],
  )
  const availableTickets = parseInt(dispCheck[0].disponibles, 10)
  const quantityValidationError = getTicketQuantityValidationError(data.cantidadBoletos, availableTickets)
  if (quantityValidationError) {
    throw new ValidationError(quantityValidationError)
  }

  // Para transferencia: crear compra PENDIENTE sin asignar boletos todavía
  if (data.metodoPago === 'TRANSFERENCIA') {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const comprador = await upsertComprador(data.comprador, client)
      const compra = await createCompra(
        data.sorteoId,
        comprador.id,
        data.cantidadBoletos,
        client,
        'TRANSFERENCIA',
        data.comprobanteUrl,
      )
      await client.query('COMMIT')

      try {
        await sendTransferenciaPendienteEmail({
          to: comprador.email,
          nombre: comprador.nombre,
          sorteoNombre: sorteo.nombre,
          cantidadBoletos: data.cantidadBoletos,
          compraId: compra.id,
        })
      } catch (emailError) {
        console.error('Compra pendiente registrada, pero no se pudo enviar el correo:', emailError)
      }

      return { compra, comprador, boletos: [], numerosEspeciales: [], pendiente: true }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  // Para TC: flujo normal con asignación inmediata de boletos
  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        `SELECT pg_advisory_xact_lock(('x' || substr(md5($1), 1, 16))::bit(64)::bigint)`,
        [data.sorteoId],
      )

      const numerosAsignados = await asignarNumerosAleatorios(
        data.sorteoId,
        sorteo.numero_maximo_boletos,
        data.cantidadBoletos,
        client,
      )

      if (numerosAsignados.length < data.cantidadBoletos) {
        await client.query('ROLLBACK')
        throw new ValidationError(
          `No hay suficientes boletos disponibles. Solo quedan ${numerosAsignados.length} boletos.`,
        )
      }

      const comprador = await upsertComprador(data.comprador, client)
      const compra = await createCompra(
        data.sorteoId,
        comprador.id,
        data.cantidadBoletos,
        client,
        'TARJETA',
      )
      const boletos = await insertarBoletos(data.sorteoId, compra.id, numerosAsignados, client)

      await client.query('COMMIT')

      const result = {
        compra,
        comprador,
        boletos,
        numerosEspeciales: boletos.filter((b: { tiene_numero_especial: boolean }) => b.tiene_numero_especial),
        pendiente: false,
      }

      try {
        await sendPurchaseConfirmationEmail({
          to: comprador.email,
          nombre: comprador.nombre,
          sorteoNombre: sorteo.nombre,
          cantidadBoletos: data.cantidadBoletos,
          boletos: boletos.map((b: { id: string; numero: number; tiene_numero_especial?: boolean }) => ({
            id: b.id,
            numero: b.numero,
            tiene_numero_especial: b.tiene_numero_especial,
          })),
        })
      } catch (emailError) {
        console.error('Compra registrada, pero no se pudo enviar el correo de confirmacion:', emailError)
      }

      return result
    } catch (e: unknown) {
      await client.query('ROLLBACK')
      const isUniqueViolation =
        e instanceof Error && 'code' in e && (e as NodeJS.ErrnoException).code === '23505'
      if (isUniqueViolation && intento < MAX_REINTENTOS) continue
      throw e
    } finally {
      client.release()
    }
  }

  throw new ConflictError('No fue posible completar la compra por alta concurrencia. Intenta nuevamente.')
}

export async function validarCompra(compraId: string, data: ValidarCompraDto, adminId: string) {
  const compra = await findCompraById(compraId)
  if (!compra) throw new NotFoundError('Compra')
  if (compra.estado_pago !== 'PENDIENTE') {
    throw new ForbiddenError('Esta compra ya fue procesada.')
  }
  if (compra.metodo_pago !== 'TRANSFERENCIA') {
    throw new ForbiddenError('Solo se pueden validar compras por transferencia bancaria.')
  }

  if (data.accion === 'RECHAZADO') {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const compraActualizada = await actualizarEstadoCompra(compraId, 'RECHAZADO', adminId, client)
      await client.query('COMMIT')
      return { compra: compraActualizada, boletos: [], rechazado: true }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  // Validar: asignar boletos ahora
  const sorteo = await findSorteoById(compra.sorteo_id)
  if (!sorteo) throw new NotFoundError('Sorteo')

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        `SELECT pg_advisory_xact_lock(('x' || substr(md5($1), 1, 16))::bit(64)::bigint)`,
        [compra.sorteo_id],
      )

      const numerosAsignados = await asignarNumerosAleatorios(
        compra.sorteo_id,
        sorteo.numero_maximo_boletos,
        compra.total_boletos,
        client,
      )

      if (numerosAsignados.length < compra.total_boletos) {
        await client.query('ROLLBACK')
        throw new ValidationError(
          `No hay suficientes boletos disponibles. Solo quedan ${numerosAsignados.length} boletos.`,
        )
      }

      // Emitir factura en Contifico antes de confirmar
      let contificoResult: { documento_id: string; autorizacion: string; numero_doc: string } | undefined
      try {
        const factura = await emitirFactura({
          cedula: compra.cedula,
          nombre: compra.comprador_nombre,
          telefono: compra.telefono,
          email: compra.email,
          direccion: compra.direccion,
          cantidadBoletos: compra.total_boletos,
          sorteoNombre: sorteo.nombre,
          compraId,
        })
        contificoResult = {
          documento_id: factura.documento_id,
          autorizacion: factura.autorizacion,
          numero_doc: factura.numero_documento,
        }
      } catch (contificoError) {
        console.error('No se pudo emitir la factura en Contifico:', contificoError)
        // No bloqueamos el flujo; se registra el error y se continúa
      }

      const compraActualizada = await actualizarEstadoCompra(compraId, 'VALIDADO', adminId, client, contificoResult)
      const boletos = await insertarBoletos(compra.sorteo_id, compraId, numerosAsignados, client)

      await client.query('COMMIT')

      try {
        await sendPurchaseConfirmationEmail({
          to: compra.email,
          nombre: compra.comprador_nombre,
          sorteoNombre: sorteo.nombre,
          cantidadBoletos: compra.total_boletos,
          boletos: boletos.map((b: { id: string; numero: number; tiene_numero_especial?: boolean }) => ({
            id: b.id,
            numero: b.numero,
            tiene_numero_especial: b.tiene_numero_especial,
          })),
        })
      } catch (emailError) {
        console.error('Compra validada, pero no se pudo enviar el correo con boletos:', emailError)
      }

      return { compra: compraActualizada, boletos, rechazado: false, factura: contificoResult }
    } catch (e: unknown) {
      await client.query('ROLLBACK')
      const isUniqueViolation =
        e instanceof Error && 'code' in e && (e as NodeJS.ErrnoException).code === '23505'
      if (isUniqueViolation && intento < MAX_REINTENTOS) continue
      throw e
    } finally {
      client.release()
    }
  }

  throw new ConflictError('No fue posible asignar boletos por alta concurrencia. Intenta nuevamente.')
}

export async function obtenerCompra(id: string) {
  const compra = await findCompraById(id)
  if (!compra) throw new NotFoundError('Compra')
  return compra
}

export async function buscarComprasPorCedula(cedula: string) {
  return findComprasByCedula(cedula)
}

export async function listarComprasPendientes(sorteoId?: string) {
  return findComprasPendientes(sorteoId)
}

export async function obtenerReporteVentas(sorteoId?: string) {
  return getReporteVentas(sorteoId)
}
