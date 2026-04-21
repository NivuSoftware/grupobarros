import { useEffect, useState } from "react";
import { Eye, EyeOff, Search, ShieldCheck, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, notifyError, notifySuccess } from "@/lib/alerts";
import { sorteoApi, neApi, ganadoresApi, boletoApi, type Boleto, type Sorteo, type NumeroEspecial } from "@/lib/api";

type GanadorMarcadoResult = {
  boleto: Boleto;
  cerradoAutomaticamente: boolean;
};

export default function Ganadores() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [selected, setSelected] = useState<Sorteo | null>(null);
  const [ne, setNe] = useState<NumeroEspecial[]>([]);
  const [loading, setLoading] = useState(true);

  const flash = (message: string, type: "success" | "error" = "success") => {
    if (type === "error") notifyError(message);
    else notifySuccess(message);
  };

  const loadSorteos = async () => {
    setLoading(true);
    try {
      const [activos, cerrados] = await Promise.all([
        sorteoApi.listar("ACTIVO"),
        sorteoApi.listar("CERRADO"),
      ]);
      const all = [...activos, ...cerrados];
      setSorteos(all);
      if (!selected && all.length > 0) setSelected(all[0]);
    } catch (e: unknown) {
      flash(getErrorMessage(e, "Error al cargar sorteos"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSorteos(); }, []);

  useEffect(() => {
    if (!selected) return;
    neApi.listar(selected.id)
      .then(setNe)
      .catch((e: unknown) => flash(getErrorMessage(e, "Error al cargar números especiales"), "error"));
  }, [selected]);

  const reloadSelected = async () => {
    if (!selected) return;
    const s = await sorteoApi.obtener(selected.id);
    setSelected(s);
    neApi.listar(s.id).then(setNe);
    loadSorteos();
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gestión</p>
        <h1 className="mt-2 text-3xl font-extrabold">Ganadores</h1>
      </div>

      {sorteos.length === 0 ? (
        <div className="rounded-md border border-dashed border-primary/20 p-8 text-center text-muted-foreground">
          No hay sorteos activos o cerrados. Publica un sorteo para gestionar ganadores.
        </div>
      ) : (
        <>
          {/* Selector de sorteo */}
          {sorteos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {sorteos.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected?.id === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.nombre}
                  <span className={`ml-2 text-xs ${s.estado === "ACTIVO" ? "text-green-400" : "text-zinc-400"}`}>
                    {s.estado}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              {/* Premio Mayor */}
              <PremioMayorCard
                sorteo={selected}
                onGanadorMarcado={(payload) =>
                  ganadoresApi.marcarMayor(selected.id, payload)
                    .then((res) => {
                      flash(res.cerradoAutomaticamente
                        ? "¡Ganador mayor marcado! El sorteo se cerró automáticamente."
                        : "Ganador mayor marcado.");
                      reloadSelected();
                      return res;
                    })
                    .catch((e: unknown) => flash(getErrorMessage(e, "Error"), "error"))
                }
              />

              {/* Números Especiales */}
              <div className="rounded-md border border-primary/20 bg-card/80 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <h2 className="font-bold">Números especiales</h2>
                </div>

                {ne.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin números especiales configurados.</p>
                ) : (
                  <div className="space-y-3">
                    {ne.map((n) => (
                      <NumeroEspecialGanadorRow
                        key={n.id}
                        ne={n}
                        sorteo={selected}
                        onGanadorMarcado={(boletoId) =>
                          neApi.marcarGanador(n.id, boletoId)
                            .then((res) => {
                              flash(res.cerradoAutomaticamente
                                ? "¡Ganador marcado! El sorteo se cerró automáticamente."
                                : `Ganador del número ${n.numero} marcado.`);
                              reloadSelected();
                              return res;
                            })
                            .catch((e: unknown) => flash(getErrorMessage(e, "Error"), "error"))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Premio Mayor Card ────────────────────────────────────────────────────────

function PremioMayorCard({
  sorteo,
  onGanadorMarcado,
}: {
  sorteo: Sorteo;
  onGanadorMarcado: (payload: { boletoId: string; boletoNumero: number }) => Promise<GanadorMarcadoResult | void>;
}) {
  const [numeroBoleto, setNumeroBoleto] = useState("");
  const [uuidConfirmacion, setUuidConfirmacion] = useState("");
  const [boletoEncontrado, setBoletoEncontrado] = useState<Boleto | null>(null);
  const [ganador, setGanador] = useState<Boleto | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const ganadorMayor = ganador ?? sorteo.premio_mayor_boleto ?? null;

  useEffect(() => {
    setNumeroBoleto("");
    setUuidConfirmacion("");
    setBoletoEncontrado(null);
    setGanador(null);
    setSearching(false);
    setSaving(false);
  }, [sorteo.id]);

  const handleBuscarBoleto = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeroNormalizado = numeroBoleto.trim();
    if (!/^\d+$/.test(numeroNormalizado)) {
      notifyError("Ingresa un número de boleto válido.");
      return;
    }
    const numero = Number(numeroNormalizado);

    setSearching(true);
    try {
      const boleto = await boletoApi.buscarPorNumero(sorteo.id, numero);
      if (!boleto) {
        setBoletoEncontrado(null);
        setUuidConfirmacion("");
        notifyError("No se encontró un comprador para ese número de boleto.");
        return;
      }

      setBoletoEncontrado(boleto);
      setUuidConfirmacion("");
      notifySuccess("Boleto encontrado. Verifica el UUID con el comprador.");
    } catch (e: unknown) {
      notifyError(getErrorMessage(e, "No se pudo buscar el boleto"));
    } finally {
      setSearching(false);
    }
  };

  const handleDeclararGanador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boletoEncontrado) return;

    const uuidIngresado = uuidConfirmacion.trim();
    if (!uuidIngresado) {
      notifyError("Ingresa el UUID entregado por el comprador.");
      return;
    }
    if (uuidIngresado !== boletoEncontrado.id) {
      notifyError("El UUID ingresado no coincide con el boleto encontrado.");
      return;
    }

    setSaving(true);
    try {
      const result = await onGanadorMarcado({
        boletoId: boletoEncontrado.id,
        boletoNumero: boletoEncontrado.numero,
      });
      if (result?.boleto) setGanador(result.boleto);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-primary/20 bg-card/80 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">Premio mayor</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{sorteo.premio_mayor_nombre}</p>

      {sorteo.premio_mayor_boleto_id ? (
        <div className="rounded-md bg-green-500/10 border border-green-500/30 px-4 py-3">
          <p className="text-sm font-semibold text-green-400">✓ Ganador declarado</p>
          <p className="text-xs text-muted-foreground mt-1">ID boleto: {sorteo.premio_mayor_boleto_id}</p>
          {ganadorMayor && <CompradorGanador boleto={ganadorMayor} />}
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleBuscarBoleto} className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/80">Paso 1</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa el número del boleto ganador para ver los datos del comprador registrado.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input
                required
                inputMode="numeric"
                value={numeroBoleto}
                onChange={(e) => {
                  setNumeroBoleto(e.target.value);
                  setBoletoEncontrado(null);
                  setUuidConfirmacion("");
                }}
                placeholder="Número del boleto ganador"
                className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-3 py-2 text-sm font-mono"
              />
              <Button type="submit" disabled={searching} variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                {searching ? "Buscando..." : "Buscar boleto"}
              </Button>
            </div>
          </form>

          {boletoEncontrado && (
            <>
              <CompradorGanador boleto={boletoEncontrado} />

              <form onSubmit={handleDeclararGanador} className="space-y-3 rounded-md border border-primary/20 bg-background/40 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/80">Paso 2</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pide al comprador el UUID de su boleto y escríbelo exactamente igual para confirmar el premio mayor.
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <input
                    required
                    value={uuidConfirmacion}
                    onChange={(e) => setUuidConfirmacion(e.target.value)}
                    placeholder="UUID entregado por el comprador"
                    className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-3 py-2 text-sm font-mono"
                  />
                  <Button type="submit" disabled={saving} className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {saving ? "Verificando..." : "Confirmar y declarar"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Número Especial Ganador Row ──────────────────────────────────────────────

function NumeroEspecialGanadorRow({
  ne,
  sorteo,
  onGanadorMarcado,
}: {
  ne: NumeroEspecial;
  sorteo: Sorteo;
  onGanadorMarcado: (boletoId: string) => Promise<GanadorMarcadoResult | void>;
}) {
  const [boletoId, setBoletoId] = useState("");
  const [ganador, setGanador] = useState<Boleto | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boletoId.trim()) return;
    setSaving(true);
    try {
      const result = await onGanadorMarcado(boletoId.trim());
      if (result?.boleto) setGanador(result.boleto);
    }
    finally { setSaving(false); }
  };

  const tipoColor = ne.tipo === "ORO" ? "text-yellow-400" : "text-orange-400";
  const isPH = ne.numero < 0;
  const ganadorActual = ganador ?? getGanadorFromNumeroEspecial(ne);

  if (isPH) {
    return (
      <div className="flex items-center gap-3 rounded-md bg-background/70 px-4 py-3 text-sm text-muted-foreground italic">
        <span className={`text-xs font-bold uppercase ${tipoColor}`}>{ne.tipo}</span>
        Sin número configurado — edita este número especial en la sección Sorteos.
      </div>
    );
  }

  return (
    <div className="rounded-md bg-background/70 px-4 py-3">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className={`text-xs font-bold uppercase ${tipoColor}`}>{ne.tipo}</span>
        <span className="font-mono font-semibold">{String(ne.numero).padStart(4, "0")}</span>
        {ne.nombre_premio && <span className="text-sm text-muted-foreground">{ne.nombre_premio}</span>}
        {ne.es_ganador && (
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400">
            Ganador ✓
          </span>
        )}
      </div>

      {ne.es_ganador ? (
        ganadorActual ? (
          <CompradorGanador boleto={ganadorActual} compact />
        ) : (
          <div className="text-xs text-muted-foreground">
            Boleto: <span className="font-mono">{ne.boleto_ganador_id}</span>
            {ne.comprador_nombre && <> · {ne.comprador_nombre} ({ne.comprador_cedula})</>}
          </div>
        )
      ) : sorteo.estado !== "CERRADO" ? (
        <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap mt-1">
          <input
            required
            value={boletoId}
            onChange={(e) => setBoletoId(e.target.value)}
            placeholder="UUID del boleto ganador"
            className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-2 py-1.5 text-xs font-mono"
          />
          <Button type="submit" size="sm" disabled={saving} className="h-8 text-xs">
            {saving ? "..." : "Declarar"}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Sorteo cerrado sin ganador declarado.</p>
      )}
    </div>
  );
}

function getGanadorFromNumeroEspecial(ne: NumeroEspecial): Boleto | null {
  if (!ne.es_ganador || !ne.boleto_ganador_id || !ne.comprador_nombre || !ne.comprador_cedula) return null;

  return {
    id: ne.boleto_ganador_id,
    numero: ne.boleto_numero ?? ne.numero,
    tiene_numero_especial: true,
    comprador_nombre: ne.comprador_nombre,
    cedula: ne.comprador_cedula,
    telefono: ne.comprador_telefono,
    email: ne.comprador_email,
  };
}

function CompradorGanador({ boleto, compact = false }: { boleto: Boleto; compact?: boolean }) {
  return (
    <div className={`mt-3 rounded-md border border-green-500/20 bg-green-500/5 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-400">Comprador registrado</p>
      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <InfoItem label="Nombre" value={boleto.comprador_nombre} />
        <SensitiveInfoItem label="Cédula" value={boleto.cedula} />
        <InfoItem label="Correo" value={boleto.email ?? "—"} />
        <SensitiveInfoItem label="Teléfono" value={boleto.telefono ?? "—"} />
        <InfoItem label="Número" value={String(boleto.numero).padStart(4, "0")} />
        <SensitiveInfoItem label="UUID boleto" value={boleto.id} mono />
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{label}</span>
      <span className={`mt-0.5 block break-all text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function SensitiveInfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [visible, setVisible] = useState(false);
  const safeValue = value?.trim() ? value : "—";
  const maskedValue = safeValue === "—" ? safeValue : "*".repeat(Math.max(safeValue.length, 8));

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{label}</span>
        {safeValue !== "—" && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
            title={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <span className={`mt-0.5 block break-all text-foreground ${mono ? "font-mono" : ""}`}>
        {visible ? safeValue : maskedValue}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-secondary" />
      <div className="h-32 rounded-md bg-secondary" />
      <div className="h-48 rounded-md bg-secondary" />
    </div>
  );
}
