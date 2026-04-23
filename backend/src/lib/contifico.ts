const CONTIFICO_API_URL = 'https://api.contifico.com/sistema/api/v1'
const API_KEY = process.env.CONTIFICO_API_KEY ?? ''
const API_TOKEN = process.env.CONTIFICO_API_TOKEN ?? ''
const PRODUCTO_BOLETO_ID = process.env.CONTIFICO_PRODUCTO_ID ?? ''
// Prefijo de establecimiento para numeración de facturas (ej: "001-001")
// El secuencial se deriva del compraId para garantizar unicidad
const DOC_PREFIJO = process.env.CONTIFICO_DOC_PREFIJO ?? '001-001'
// ID de la cuenta bancaria donde se reciben las transferencias (configurar en .env)
const CUENTA_BANCARIA_ID = process.env.CONTIFICO_CUENTA_BANCARIA_ID ?? ''
// Tipo de transaccion TC requerido por Contifico: D, M, E, P, A
const TC_TIPO_PING = process.env.CONTIFICO_TC_TIPO_PING ?? 'P'
const TC_TIPO_PING_CANDIDATES = (
  process.env.CONTIFICO_TC_TIPO_PING_CANDIDATES ?? `${TC_TIPO_PING},D,M,E,P,A`
)
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean)
const PRECIO_BOLETO = 2

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

// Genera un secuencial de 9 dígitos a partir del UUID de la compra
function generarSecuencial(compraId: string): string {
  // Toma los últimos 9 caracteres hex del UUID y convierte a número
  const hex = compraId.replace(/-/g, '').slice(-9)
  const num = parseInt(hex, 16) % 999999999
  return num.toString().padStart(9, '0')
}

async function contificoFetch(path: string, options: RequestInit = {}) {
  const url = `${CONTIFICO_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!res.ok) {
    const msg = typeof data === 'object' && data !== null ? JSON.stringify(data) : String(data)
    throw new Error(`Contifico API error ${res.status}: ${msg}`)
  }

  return data
}

export interface DatosFactura {
  cedula: string
  nombre: string
  telefono: string
  email: string
  direccion?: string
  cantidadBoletos: number
  sorteoNombre: string
  compraId: string
  /** Forma de cobro Contifico: 'TRA' (transferencia) | 'TC' (tarjeta crédito/débito). Default: 'TRA' */
  formaCobro?: 'TRA' | 'TC'
  /** Referencia del cobro (ej. transactionId de Payphone). Default: primeros 15 chars del compraId */
  referenciaCobro?: string
}

export interface ResultadoFactura {
  documento_id: string
  autorizacion: string
  numero_documento: string
}

function getTipoPingCandidates() {
  return [...new Set(TC_TIPO_PING_CANDIDATES)].filter((value) =>
    ['D', 'M', 'E', 'P', 'A'].includes(value),
  )
}

function shouldRetryWithAnotherTipoPing(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('tipo_ping') || error.message.includes('cuenta asignada tipo_ping'))
  )
}

function buildCobrosPayload(datos: DatosFactura, total: number, hoy: string, tipoPing?: string) {
  const formaCobro = datos.formaCobro ?? 'TRA'
  const numeroComprobante = datos.referenciaCobro ?? datos.compraId.slice(0, 15)

  if (formaCobro === 'TC') {
    return [
      {
        forma_cobro: formaCobro,
        monto: total,
        fecha: hoy,
        numero_comprobante: numeroComprobante,
        tipo_ping: tipoPing ?? TC_TIPO_PING,
      },
    ]
  }

  return [
    {
      forma_cobro: formaCobro,
      monto: total,
      fecha: hoy,
      cuenta_bancaria_id: formaCobro === 'TRA' ? (CUENTA_BANCARIA_ID || null) : null,
      numero_comprobante: numeroComprobante,
      tipo_ping: null,
    },
  ]
}

export async function emitirFactura(datos: DatosFactura): Promise<ResultadoFactura> {
  const hoy = formatDate(new Date())
  const totalBoletos = datos.cantidadBoletos
  const precioUnitario = PRECIO_BOLETO
  const subtotal0 = parseFloat((totalBoletos * precioUnitario).toFixed(2))
  const iva = 0.0
  const total = subtotal0
  const numeroDocumento = `${DOC_PREFIJO}-${generarSecuencial(datos.compraId)}`

  const formaCobro = datos.formaCobro ?? 'TRA'
  const tipoPingCandidates = formaCobro === 'TC' ? getTipoPingCandidates() : [undefined]
  let lastError: unknown

  for (const tipoPing of tipoPingCandidates) {
    const body = {
      pos: API_TOKEN,
      fecha_emision: hoy,
      tipo_documento: 'FAC',
      documento: numeroDocumento,
      electronico: true,
      estado: 'P',
      autorizacion: '',
      caja_id: null,
      cliente: {
        cedula: datos.cedula,
        razon_social: datos.nombre,
        telefonos: datos.telefono,
        direccion: datos.direccion ?? 'Ecuador',
        tipo: 'N',
        email: datos.email,
        es_extranjero: false,
      },
      descripcion: `Boletos sorteo: ${datos.sorteoNombre}`,
      subtotal_0: subtotal0,
      subtotal_12: 0.0,
      iva: iva,
      ice: 0.0,
      servicio: 0.0,
      total: total,
      adicional1: datos.compraId,
      adicional2: '',
      detalles: [
        {
          producto_id: PRODUCTO_BOLETO_ID,
          cantidad: totalBoletos,
          precio: precioUnitario,
          porcentaje_iva: 0,
          porcentaje_descuento: 0.0,
          base_cero: subtotal0,
          base_gravable: 0.0,
          base_no_gravable: 0.0,
        },
      ],
      cobros: buildCobrosPayload(datos, total, hoy, tipoPing),
    }

    try {
      const response = await contificoFetch('/documento/', {
        method: 'POST',
        body: JSON.stringify(body),
      }) as Record<string, unknown>

      if (formaCobro === 'TC') {
        console.info('[contifico] cobro.tc_registrado', {
          compraId: datos.compraId,
          tipoPing,
          documentoId: String(response.id ?? ''),
        })
      }

      return {
        documento_id: String(response.id ?? ''),
        autorizacion: String(response.autorizacion ?? ''),
        numero_documento: String(response.documento ?? ''),
      }
    } catch (error) {
      lastError = error
      if (formaCobro === 'TC' && shouldRetryWithAnotherTipoPing(error)) {
        console.warn('[contifico] cobro.tc_tipo_ping_rechazado', {
          compraId: datos.compraId,
          tipoPing,
          error: error instanceof Error ? error.message : String(error),
        })
        continue
      }
      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo registrar el cobro en Contifico.')
}
