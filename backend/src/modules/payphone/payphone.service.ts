import pool from '@/lib/db'
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors'
import { sendPurchaseConfirmationEmail } from '@/lib/mail'
import { emitirFactura, type DatosFactura } from '@/lib/contifico'
import { findSorteoById } from '../sorteos/sorteos.repository'
import {
  upsertComprador,
  createCompra,
  asignarNumerosAleatorios,
  insertarBoletos,
  findCompraById,
  actualizarEstadoCompra,
} from '../compras/compras.repository'

// ─── Payphone config ──────────────────────────────────────────────────────────
const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN ?? ''
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID ?? ''

const TICKET_PRICE = 2 // USD
const MAX_REINTENTOS = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function payphoneFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://pay.payphonetodoesposible.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAYPHONE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const msg = typeof data === 'object' && data !== null ? JSON.stringify(data) : String(data)
    throw new Error(`Payphone API error ${res.status}: ${msg}`)
  }
  return data
}

// ─── Iniciar pago ─────────────────────────────────────────────────────────────
// Reserva la compra en BD (estado PENDIENTE) y devuelve los datos que el
// frontend necesita para abrir la cajita de Payphone.

export async function iniciarPagoPayphone(data: {
  sorteoId: string
  cantidadBoletos: number
  comprador: {
    nombre: string
    cedula: string
    telefono: string
    email: string
    direccion?: string
  }
}) {
  const sorteo = await findSorteoById(data.sorteoId)
  if (!sorteo) throw new NotFoundError('Sorteo')
  if (sorteo.estado !== 'ACTIVO') {
    throw new ForbiddenError('No se pueden comprar boletos en este momento. El sorteo no está activo.')
  }

  // Verificación optimista de disponibilidad
  const { rows: dispCheck } = await pool.query(
    `SELECT ($1 + 1) - COUNT(*) AS disponibles FROM boletos WHERE sorteo_id = $2`,
    [sorteo.numero_maximo_boletos, data.sorteoId],
  )
  if (parseInt(dispCheck[0].disponibles) < data.cantidadBoletos) {
    throw new ValidationError(
      `No hay suficientes boletos disponibles. Disponibles: ${dispCheck[0].disponibles}`,
    )
  }

  const monto = data.cantidadBoletos * TICKET_PRICE

  // Crear compra PENDIENTE sin boletos aún (el compraId será el clientTransactionId)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const comprador = await upsertComprador(data.comprador, client)
    const compra = await createCompra(
      data.sorteoId,
      comprador.id,
      data.cantidadBoletos,
      client,
      'TARJETA',
      undefined,
      'PENDIENTE', // boletos se asignan solo tras confirmar pago con Payphone
    )
    await client.query('COMMIT')

    return {
      compraId: compra.id,
      monto,                          // en dólares
      montoEnCentavos: monto * 100,   // Payphone espera centavos
      storeId: PAYPHONE_STORE_ID,
      clienteNombre: comprador.nombre,
      clienteEmail: comprador.email,
    }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ─── Confirmar pago ───────────────────────────────────────────────────────────
// Llamado desde el frontend tras el callback de Payphone.
// Verifica con la API de Payphone, y si está aprobado, asigna boletos + Contifico.

export async function confirmarPagoPayphone(transactionId: number, clientTransactionId: string) {
  // 1. Verificar con Payphone
  const payphoneRes = await payphoneFetch(
    `/api/button/V2/Confirm?id=${transactionId}&clientTransactionId=${encodeURIComponent(clientTransactionId)}`,
    { method: 'GET' },
  ) as Record<string, unknown>

  // statusCode === 3 → aprobada
  const statusCode = Number(payphoneRes.statusCode ?? payphoneRes.transactionStatus ?? -1)
  if (statusCode !== 3) {
    const msg = String(payphoneRes.statusMessage ?? payphoneRes.message ?? 'Pago no aprobado')
    throw new ValidationError(`El pago no fue aprobado por Payphone: ${msg}`)
  }

  // 2. Obtener la compra PENDIENTE
  const compra = await findCompraById(clientTransactionId)
  if (!compra) throw new NotFoundError('Compra')
  if (compra.metodo_pago !== 'TARJETA') {
    throw new ForbiddenError('Esta compra no corresponde a un pago con tarjeta.')
  }
  if (compra.estado_pago === 'VALIDADO') {
    // Idempotencia: ya fue procesada (doble callback)
    return { yaConfirmada: true, compraId: compra.id }
  }
  if (compra.estado_pago === 'RECHAZADO') {
    throw new ForbiddenError('Esta compra fue rechazada previamente.')
  }

  const sorteo = await findSorteoById(compra.sorteo_id)
  if (!sorteo) throw new NotFoundError('Sorteo')

  // 3. Asignar boletos + emitir factura en Contifico
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

      // Emitir factura en Contifico (forma de cobro TC = tarjeta de crédito)
      let contificoResult: { documento_id: string; autorizacion: string; numero_doc: string } | undefined
      try {
        const factura = await emitirFacturaTC({
          cedula: compra.cedula,
          nombre: compra.comprador_nombre,
          telefono: compra.telefono,
          email: compra.email,
          direccion: compra.direccion,
          cantidadBoletos: compra.total_boletos,
          sorteoNombre: sorteo.nombre,
          compraId: clientTransactionId,
          payphoneTransactionId: String(transactionId),
        })
        contificoResult = {
          documento_id: factura.documento_id,
          autorizacion: factura.autorizacion,
          numero_doc: factura.numero_documento,
        }
      } catch (contificoError) {
        console.error('No se pudo emitir la factura en Contifico (tarjeta):', contificoError)
      }

      // Marcar como VALIDADO (sin adminId ya que es automático)
      const compraActualizada = await actualizarEstadoCompra(
        clientTransactionId,
        'VALIDADO',
        'payphone-auto',
        client,
        contificoResult,
      )

      const boletos = await insertarBoletos(compra.sorteo_id, clientTransactionId, numerosAsignados, client)

      await client.query('COMMIT')

      // Enviar email con los boletos
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
        console.error('Pago confirmado, pero no se pudo enviar el correo con boletos:', emailError)
      }

      return {
        yaConfirmada: false,
        compra: compraActualizada,
        boletos,
        factura: contificoResult,
        pendiente: false,
      }
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

async function emitirFacturaTC(datos: Omit<DatosFactura, 'formaCobro' | 'referenciaCobro'> & { payphoneTransactionId: string }) {
  return emitirFactura({
    cedula: datos.cedula,
    nombre: datos.nombre,
    telefono: datos.telefono,
    email: datos.email,
    direccion: datos.direccion,
    cantidadBoletos: datos.cantidadBoletos,
    sorteoNombre: datos.sorteoNombre,
    compraId: datos.compraId,
    formaCobro: 'TC',
    referenciaCobro: datos.payphoneTransactionId,
  })
}
