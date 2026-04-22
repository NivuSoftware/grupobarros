const CONTIFICO_API_URL = 'https://api.contifico.com/sistema/api/v1'
const API_KEY = process.env.CONTIFICO_API_KEY ?? ''
const API_TOKEN = process.env.CONTIFICO_API_TOKEN ?? ''
const PRODUCTO_BOLETO_ID = process.env.CONTIFICO_PRODUCTO_ID ?? ''
// Prefijo de establecimiento para numeración de facturas (ej: "001-001")
// El secuencial se deriva del compraId para garantizar unicidad
const DOC_PREFIJO = process.env.CONTIFICO_DOC_PREFIJO ?? '001-001'
// ID de la cuenta bancaria donde se reciben las transferencias (configurar en .env)
const CUENTA_BANCARIA_ID = process.env.CONTIFICO_CUENTA_BANCARIA_ID ?? ''
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

export async function emitirFactura(datos: DatosFactura): Promise<ResultadoFactura> {
  const hoy = formatDate(new Date())
  const totalBoletos = datos.cantidadBoletos
  const precioUnitario = PRECIO_BOLETO
  // El servicio "Boleto Rifa" tiene 15% IVA
  const subtotal15 = parseFloat((totalBoletos * precioUnitario).toFixed(2))
  const iva = parseFloat((subtotal15 * 0.15).toFixed(2))
  const total = parseFloat((subtotal15 + iva).toFixed(2))
  const numeroDocumento = `${DOC_PREFIJO}-${generarSecuencial(datos.compraId)}`

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
    subtotal_0: 0.0,
    subtotal_12: subtotal15,
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
        porcentaje_iva: 15,
        porcentaje_descuento: 0.0,
        base_cero: 0.0,
        base_gravable: subtotal15,
        base_no_gravable: 0.0,
      },
    ],
    // Sin cobros — la factura queda en estado P (pendiente) ya que se validó por transferencia
  }

  const response = await contificoFetch('/documento/', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Record<string, unknown>

  const documentoId = String(response.id ?? '')

  // Registrar el cobro para que la factura quede en estado cobrado
  const formaCobro = datos.formaCobro ?? 'TRA'
  const numeroComprobante = datos.referenciaCobro ?? datos.compraId.slice(0, 15)
  await contificoFetch(`/documento/${documentoId}/cobro/`, {
    method: 'POST',
    body: JSON.stringify({
      forma_cobro: formaCobro,
      monto: total,
      tipo_ping: null,
      cuenta_bancaria_id: formaCobro === 'TRA' ? (CUENTA_BANCARIA_ID || null) : null,
      numero_comprobante: numeroComprobante,
    }),
  })

  return {
    documento_id: documentoId,
    autorizacion: String(response.autorizacion ?? ''),
    numero_documento: String(response.documento ?? ''),
  }
}
