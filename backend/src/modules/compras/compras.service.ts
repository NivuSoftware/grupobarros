import pool from '@/lib/db'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { sendPurchaseConfirmationEmail, sendTransferenciaPendienteEmail } from '@/lib/mail'
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

  // Verificación optimista de disponibilidad (considera boletos ya asignados + reservados por pendientes)
  const { rows: dispCheck } = await pool.query(
    `SELECT ($1 + 1) - COUNT(*) AS disponibles
     FROM boletos WHERE sorteo_id = $2`,
    [sorteo.numero_maximo_boletos, data.sorteoId],
  )
  if (parseInt(dispCheck[0].disponibles) < data.cantidadBoletos) {
    throw new ValidationError(
      `No hay suficientes boletos disponibles. Disponibles: ${dispCheck[0].disponibles}`,
    )
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

      const compraActualizada = await actualizarEstadoCompra(compraId, 'VALIDADO', adminId, client)
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

      return { compra: compraActualizada, boletos, rechazado: false }
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

export async function listarComprasPendientes() {
  return findComprasPendientes()
}

export async function obtenerReporteVentas() {
  return getReporteVentas()
}
