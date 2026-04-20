import { getAccessToken } from "./auth";

const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");
const BASE = rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({ success: false, error: "Error de red" }));
  if (!res.ok) throw new Error(json.error || json.message || "Error del servidor");
  return json.data as T;
}

async function uploadFile(file: File): Promise<string> {
  const token = getAccessToken();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  const json = await res.json().catch(() => ({ success: false, error: "Error de red" }));
  if (!res.ok) throw new Error(json.error || json.message || "Error al subir imagen");
  return (json.data as { url: string }).url;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoSorteo = "DRAFT" | "ACTIVO" | "CERRADO";
export type TipoNumeroEspecial = "ORO" | "NARANJA";

export interface Sorteo {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoSorteo;
  numero_maximo_boletos: number;
  premio_mayor_nombre: string;
  premio_mayor_descripcion?: string;
  premio_mayor_imagenes: string[];
  premio_mayor_boleto_id?: string;
  premio_mayor_boleto?: Boleto | null;
  boletos_vendidos: number;
  creado_en: string;
  cerrado_en?: string;
}

export interface NumeroEspecial {
  id: string;
  sorteo_id: string;
  numero: number;
  tipo: TipoNumeroEspecial;
  nombre_premio?: string;
  descripcion?: string;
  imagen?: string;
  es_ganador: boolean;
  boleto_ganador_id?: string;
  fecha_marcado_ganador?: string;
  boleto_numero?: number;
  comprador_nombre?: string;
  comprador_cedula?: string;
  comprador_telefono?: string;
  comprador_email?: string;
}

export interface Boleto {
  id: string;
  numero: number;
  tiene_numero_especial: boolean;
  comprador_nombre: string;
  cedula: string;
  telefono?: string;
  email?: string;
}

export interface Compra {
  id: string;
  sorteo_id: string;
  total_boletos: number;
  monto?: number | string | null;
  creado_en: string;
  comprador_nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  boletos: { id: string; numero: number; tieneNumeroEspecial: boolean }[];
}

export type MetodoPago = "TARJETA" | "TRANSFERENCIA";
export type EstadoPago = "PENDIENTE" | "VALIDADO" | "RECHAZADO";

export interface CompraCreada {
  compra: {
    id: string;
    sorteo_id: string;
    comprador_id: string;
    total_boletos: number;
    monto?: number | string | null;
    metodo_pago: MetodoPago;
    estado_pago: EstadoPago;
    comprobante_url?: string;
    creado_en: string;
  };
  comprador: {
    id: string;
    nombre: string;
    cedula: string;
    telefono: string;
    email: string;
  };
  boletos: {
    id: string;
    numero: number;
    tiene_numero_especial: boolean;
    numero_especial_id?: string | null;
  }[];
  numerosEspeciales: {
    id: string;
    numero: number;
    tiene_numero_especial: boolean;
    numero_especial_id?: string | null;
  }[];
  pendiente: boolean;
}

export interface CompraPendiente {
  id: string;
  sorteo_id: string;
  sorteo_nombre: string;
  comprador_nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  total_boletos: number;
  monto?: number | string | null;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  comprobante_url?: string;
  creado_en: string;
}

export interface ReporteVentas {
  ventas_realizadas: number;
  boletos_vendidos: number;
  dinero_esperado: number;
  ventas_transferencia: number;
  ventas_tarjeta: number;
  ventas_pendientes: number;
  ventas_rechazadas: number;
  precio_boleto: number;
}

export interface Estadisticas {
  sorteo: Sorteo;
  estadisticas: {
    totalBoletos: number;
    vendidos: number;
    disponibles: number;
    porcentajeVendido: number;
  };
}

// ─── Sorteos ──────────────────────────────────────────────────────────────────

export const sorteoApi = {
  listar: (estado?: EstadoSorteo) =>
    request<Sorteo[]>(`/api/sorteos${estado ? `?estado=${estado}` : ""}`),

  obtener: (id: string) => request<Sorteo>(`/api/sorteos/${id}`),

  crear: (body: {
    nombre: string;
    descripcion?: string;
    numeroMaximoBoletos: number;
    premioMayorNombre: string;
    premioMayorDescripcion?: string;
    premioMayorImagenes?: string[];
  }) => request<Sorteo>("/api/sorteos", { method: "POST", body: JSON.stringify(body) }),

  editar: (id: string, body: Partial<{
    nombre: string;
    descripcion: string;
    numeroMaximoBoletos: number;
    premioMayorNombre: string;
    premioMayorDescripcion: string;
    premioMayorImagenes: string[];
  }>) => request<Sorteo>(`/api/sorteos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  publicar: (id: string) =>
    request<Sorteo>(`/api/sorteos/${id}/publicar`, { method: "POST" }),

  cerrar: (id: string) =>
    request<Sorteo>(`/api/sorteos/${id}/cerrar`, { method: "POST" }),

  estadisticas: (id: string) => request<Estadisticas>(`/api/sorteos/${id}/estadisticas`),

  eliminar: (id: string) =>
    request<{ deleted: boolean }>(`/api/sorteos/${id}`, { method: "DELETE" }),

  boletos: (id: string, page = 1, limit = 100) =>
    request<{ boletos: Boleto[]; total: number; page: number; limit: number }>(
      `/api/sorteos/${id}/boletos?page=${page}&limit=${limit}`,
    ),
};

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadApi = {
  upload: uploadFile,
};

// ─── Números Especiales ───────────────────────────────────────────────────────

export const neApi = {
  listar: (sorteoId: string) =>
    request<NumeroEspecial[]>(`/api/sorteos/${sorteoId}/numeros-especiales`),

  agregar: (sorteoId: string, body: {
    numero: number;
    tipo: TipoNumeroEspecial;
    nombrePremio?: string;
    descripcion?: string;
    imagen?: string;
  }) =>
    request<NumeroEspecial>(`/api/sorteos/${sorteoId}/numeros-especiales`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  editar: (sorteoId: string, neId: string, body: {
    numero?: number;
    nombrePremio?: string;
    descripcion?: string;
    imagen?: string;
  }) =>
    request<NumeroEspecial>(`/api/sorteos/${sorteoId}/numeros-especiales/${neId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  eliminar: (sorteoId: string, neId: string) =>
    request<{ deleted: boolean }>(`/api/sorteos/${sorteoId}/numeros-especiales/${neId}`, {
      method: "DELETE",
    }),

  marcarGanador: (neId: string, boletoId: string) =>
    request<{ numeroEspecial: NumeroEspecial; boleto: Boleto; cerradoAutomaticamente: boolean }>(
      `/api/numeros-especiales/${neId}/ganador`,
      { method: "POST", body: JSON.stringify({ boletoId }) },
    ),
};

// ─── Ganadores ────────────────────────────────────────────────────────────────

export const ganadoresApi = {
  marcarMayor: (sorteoId: string, boletoId: string) =>
    request<{ sorteo: Sorteo; boleto: Boleto; cerradoAutomaticamente: boolean }>(
      `/api/sorteos/${sorteoId}/ganador-mayor`,
      { method: "POST", body: JSON.stringify({ boletoId }) },
    ),
};

// ─── Compras ──────────────────────────────────────────────────────────────────

export const comprasApi = {
  crear: (body: {
    sorteoId: string;
    cantidadBoletos: number;
    comprador: {
      nombre: string;
      cedula: string;
      telefono: string;
      email: string;
      direccion?: string;
    };
    metodoPago?: MetodoPago;
    comprobanteUrl?: string;
  }) => request<CompraCreada>("/api/compras", { method: "POST", body: JSON.stringify(body) }),

  buscarPorCedula: (cedula: string) =>
    request<Compra[]>(`/api/compras?cedula=${cedula}`),

  obtener: (id: string) => request<Compra>(`/api/compras/${id}`),

  listarPendientes: () =>
    request<CompraPendiente[]>("/api/compras?pendientes=1"),

  reporteVentas: () =>
    request<ReporteVentas>("/api/compras?reporte=ventas"),

  validar: (id: string, accion: "VALIDADO" | "RECHAZADO") =>
    request<{ compra: CompraPendiente; boletos: Boleto[]; rechazado: boolean }>(
      `/api/compras/${id}/validar`,
      { method: "POST", body: JSON.stringify({ accion }) },
    ),
};
