import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle, CreditCard, ExternalLink, ReceiptText, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, notifyError, notifySuccess } from "@/lib/alerts";
import { sorteoApi, comprasApi, type Sorteo, type Boleto, type Compra, type CompraPendiente, type ReporteVentas } from "@/lib/api";

const formatMoney = (value: number) => `$${value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Ventas() {
  const [sorteoActivo, setSorteoActivo] = useState<Sorteo | null>(null);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [totalBoletos, setTotalBoletos] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingBoletos, setLoadingBoletos] = useState(false);

  const [cedula, setCedula] = useState("");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [pendientes, setPendientes] = useState<CompraPendiente[]>([]);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  const [validando, setValidando] = useState<string | null>(null);
  const [reporte, setReporte] = useState<ReporteVentas | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);

  const LIMIT = 100;

  const cargarPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    try {
      const res = await comprasApi.listarPendientes();
      setPendientes(res);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Error al cargar compras pendientes"));
    } finally {
      setLoadingPendientes(false);
    }
  }, []);

  const cargarReporte = useCallback(async () => {
    setLoadingReporte(true);
    try {
      const res = await comprasApi.reporteVentas();
      setReporte(res);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Error al cargar reporte de ventas"));
    } finally {
      setLoadingReporte(false);
    }
  }, []);

  useEffect(() => {
    sorteoApi.listar("ACTIVO").then((list) => {
      const activo = list[0] ?? null;
      setSorteoActivo(activo);
      if (activo) loadBoletos(activo.id, 1);
    }).catch((err: unknown) => notifyError(getErrorMessage(err, "Error al cargar sorteo activo")));

    cargarPendientes();
    cargarReporte();
  }, [cargarPendientes, cargarReporte]);

  const loadBoletos = async (sorteoId: string, p: number) => {
    setLoadingBoletos(true);
    try {
      const res = await sorteoApi.boletos(sorteoId, p, LIMIT);
      setBoletos(res.boletos);
      setTotalBoletos(res.total);
      setPage(p);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Error al cargar boletos"));
    } finally {
      setLoadingBoletos(false);
    }
  };

  const buscarCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) return;
    setBuscando(true);
    setCompras([]);
    try {
      const res = await comprasApi.buscarPorCedula(cedula.trim());
      setCompras(res);
      setBuscado(true);
      if (res.length > 0) {
        notifySuccess(`${res.length} compra${res.length === 1 ? "" : "s"} encontrada${res.length === 1 ? "" : "s"}`);
      }
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Error al buscar"));
    } finally {
      setBuscando(false);
    }
  };

  const handleValidar = async (compraId: string, accion: "VALIDADO" | "RECHAZADO") => {
    setValidando(compraId);
    try {
      const res = await comprasApi.validar(compraId, accion);
      if (res.rechazado) {
        notifySuccess("Compra rechazada", "La compra fue marcada como rechazada.");
      } else {
        notifySuccess(
          "Compra validada",
          `Se asignaron ${res.boletos.length} boletos y se envió el correo al comprador.`,
        );
        if (sorteoActivo) loadBoletos(sorteoActivo.id, 1);
      }
      await cargarPendientes();
      await cargarReporte();
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Error al procesar la compra"));
    } finally {
      setValidando(null);
    }
  };

  const totalPages = Math.ceil(totalBoletos / LIMIT);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gestión</p>
        <h1 className="mt-2 text-3xl font-extrabold">Ventas</h1>
      </div>

      {/* Mini reportería */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReporteCard
          icon={<ReceiptText className="h-5 w-5" />}
          label="Ventas realizadas"
          value={loadingReporte ? "..." : (reporte?.ventas_realizadas ?? 0).toLocaleString("es-EC")}
          note={`${(reporte?.boletos_vendidos ?? 0).toLocaleString("es-EC")} boletos registrados`}
        />
        <ReporteCard
          icon={<Banknote className="h-5 w-5" />}
          label="Dinero esperado"
          value={loadingReporte ? "..." : formatMoney(reporte?.dinero_esperado ?? 0)}
          note={`A $${reporte?.precio_boleto ?? 2} por boleto`}
        />
        <ReporteCard
          icon={<Banknote className="h-5 w-5" />}
          label="Transferencias"
          value={loadingReporte ? "..." : (reporte?.ventas_transferencia ?? 0).toLocaleString("es-EC")}
          note={`${(reporte?.ventas_pendientes ?? 0).toLocaleString("es-EC")} pendiente${reporte?.ventas_pendientes === 1 ? "" : "s"} de validar`}
        />
        <ReporteCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Tarjeta"
          value={loadingReporte ? "..." : (reporte?.ventas_tarjeta ?? 0).toLocaleString("es-EC")}
          note={`${(reporte?.ventas_rechazadas ?? 0).toLocaleString("es-EC")} rechazada${reporte?.ventas_rechazadas === 1 ? "" : "s"} excluida${reporte?.ventas_rechazadas === 1 ? "" : "s"}`}
        />
      </div>

      {/* Compras pendientes de validación */}
      <div className="rounded-md border border-amber-500/30 bg-card/80 p-5">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
              </span>
              Comprobantes pendientes de validación
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Revisa el comprobante y aprueba o rechaza cada compra por transferencia bancaria
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={cargarPendientes} disabled={loadingPendientes}>
            {loadingPendientes ? "Cargando..." : "Actualizar"}
          </Button>
        </div>

        {loadingPendientes ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded bg-secondary" />)}
          </div>
        ) : pendientes.length === 0 ? (
          <div className="rounded-md border border-dashed border-amber-500/20 p-6 text-center text-sm text-muted-foreground">
            No hay comprobantes pendientes de validación.
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map((c) => (
              <CompraPendienteCard
                key={c.id}
                compra={c}
                validando={validando === c.id}
                onValidar={(accion) => handleValidar(c.id, accion)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Buscador por cédula */}
      <div className="rounded-md border border-primary/20 bg-card/80 p-5">
        <h2 className="mb-4 font-bold">Buscar comprador por cédula</h2>
        <form onSubmit={buscarCedula} className="flex gap-3 flex-wrap">
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Cédula (10 dígitos)"
            maxLength={10}
            className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={buscando} className="gap-2">
            <Search className="h-4 w-4" />
            {buscando ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {buscado && compras.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron compras para esa cédula.</p>
        )}

        {compras.length > 0 && (
          <div className="mt-4 space-y-3">
            {compras.map((c) => (
              <CompraCard key={c.id} compra={c} />
            ))}
          </div>
        )}
      </div>

      
    </div>
  );
}

function ReporteCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-md border border-primary/20 bg-card/80 p-5">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
    </article>
  );
}

function CompraPendienteCard({
  compra,
  validando,
  onValidar,
}: {
  compra: CompraPendiente;
  validando: boolean;
  onValidar: (accion: "VALIDADO" | "RECHAZADO") => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-amber-500/30 bg-background/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-background/50"
      >
        <div className="min-w-0">
          <span className="font-semibold">{compra.comprador_nombre}</span>
          <span className="ml-3 text-muted-foreground text-xs">{compra.cedula} · {compra.telefono}</span>
          <span className="ml-3 text-xs text-amber-400">{compra.sorteo_nombre}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs text-primary font-semibold">{compra.total_boletos} boletos</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">PENDIENTE</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-amber-500/20 px-4 py-4 space-y-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{compra.email}</p>
            <p>Recibido: {new Date(compra.creado_en).toLocaleString("es-EC")}</p>
            <p>Sorteo: {compra.sorteo_nombre}</p>
            <p>Boletos solicitados: <strong className="text-foreground">{compra.total_boletos}</strong></p>
          </div>

          {/* Comprobante */}
          {compra.comprobante_url ? (
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Comprobante de pago:</p>
              {compra.comprobante_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={compra.comprobante_url}
                  alt="Comprobante"
                  className="max-h-80 w-full object-contain rounded-lg border border-border"
                />
              ) : (
                <a
                  href={compra.comprobante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver comprobante
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-destructive">Sin comprobante adjunto.</p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => onValidar("VALIDADO")}
              disabled={validando}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              {validando ? "Procesando..." : "VALIDADO — Asignar boletos"}
            </Button>
            <Button
              onClick={() => onValidar("RECHAZADO")}
              disabled={validando}
              variant="outline"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BoletoChip({ boleto }: { boleto: Boleto }) {
  const base = "rounded px-1 py-2 text-center text-xs font-mono font-semibold transition-colors cursor-default";
  const color = boleto.tiene_numero_especial
    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
    : "bg-secondary text-foreground";

  return (
    <div className={`${base} ${color}`} title={`${boleto.comprador_nombre} — ${boleto.cedula}`}>
      {String(boleto.numero).padStart(4, "0")}
    </div>
  );
}

function CompraCard({ compra }: { compra: Compra }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-primary/20 bg-background/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-background/50"
      >
        <div>
          <span className="font-semibold">{compra.comprador_nombre}</span>
          <span className="ml-3 text-muted-foreground text-xs">{compra.cedula} · {compra.telefono}</span>
        </div>
        <span className="text-xs text-primary font-semibold">{compra.total_boletos} boletos</span>
      </button>
      {open && (
        <div className="border-t border-primary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">{compra.email} · {new Date(compra.creado_en).toLocaleString()}</p>
          <div className="flex flex-wrap gap-1.5">
            {compra.boletos?.map((b) => (
              <span
                key={b.id}
                className={`rounded px-2 py-1 text-xs font-mono font-semibold ${
                  b.tieneNumeroEspecial
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                    : "bg-secondary text-foreground"
                }`}
              >
                {String(b.numero).padStart(4, "0")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
