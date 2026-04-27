import { useEffect, useState } from "react";
import { BarChart3, Ticket, Trophy, TrendingUp } from "lucide-react";
import { sorteoApi, type Sorteo, type Estadisticas } from "@/lib/api";

export default function Resumen() {
  const [sorteoActivo, setSorteoActivo] = useState<Sorteo | null>(null);
  const [stats, setStats] = useState<Estadisticas["estadisticas"] | null>(null);
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [todos, activos] = await Promise.all([
          sorteoApi.listar(),
          sorteoApi.listar("ACTIVO"),
        ]);
        setSorteos(todos);
        const activo = activos[0] ?? null;
        setSorteoActivo(activo);
        if (activo) {
          const e = await sorteoApi.estadisticas(activo.id);
          setStats(e.estadisticas);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorBox msg={error} />;

  const cerrados = sorteos.filter((s) => s.estado === "CERRADO").length;
  const drafts = sorteos.filter((s) => s.estado === "DRAFT").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Panel administrativo</p>
        <h1 className="mt-2 text-3xl font-extrabold">Resumen general</h1>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Trophy className="h-5 w-5" />}
          label="Sorteo activo"
          value={sorteoActivo ? "1" : "0"}
          note={sorteoActivo?.nombre ?? "Sin sorteo activo"}
        />
        <MetricCard
          icon={<Ticket className="h-5 w-5" />}
          label="Boletos vendidos"
          value={stats?.vendidos.toLocaleString() ?? "Sin datos"}
          note={stats ? `${stats.porcentajeVendido}% del total` : "Sin sorteo activo"}
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Boletos disponibles"
          value={stats?.disponibles.toLocaleString() ?? "Sin datos"}
          note={stats ? `de ${stats.totalBoletos.toLocaleString()} totales` : "Sin sorteo activo"}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Sorteos históricos"
          value={cerrados.toString()}
          note={`${drafts} en borrador`}
        />
      </div>

      {/* Sorteo activo detalle */}
      {sorteoActivo && stats ? (
        <div className="rounded-md border border-primary/20 bg-card/80 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">{sorteoActivo.nombre}</h2>
              {sorteoActivo.descripcion && (
                <p className="mt-1 text-sm text-muted-foreground">{sorteoActivo.descripcion}</p>
              )}
            </div>
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
              ACTIVO
            </span>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Boletos vendidos</span>
              <span>{stats.vendidos.toLocaleString()} / {stats.totalBoletos.toLocaleString()}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gold-gradient transition-all"
                style={{ width: `${stats.porcentajeVendido}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Premio mayor" value={sorteoActivo.premio_mayor_nombre} />
            <Stat label="Rango boletos" value={`0 a ${sorteoActivo.numero_maximo_boletos.toLocaleString()}`} />
            <Stat
              label="Ganador mayor"
              value={sorteoActivo.premio_mayor_boleto_id ? "Declarado" : "Pendiente"}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-primary/20 p-8 text-center text-muted-foreground">
          No hay ningún sorteo activo. Crea uno desde la sección <strong>Sorteos</strong>.
        </div>
      )}

      {/* Lista de sorteos recientes */}
      {sorteos.length > 0 && (
        <div className="rounded-md border border-primary/20 bg-card/80 p-5">
          <h2 className="mb-4 text-lg font-bold">Todos los sorteos</h2>
          <div className="space-y-2">
            {sorteos.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md bg-background/70 px-4 py-3 text-sm">
                <span className="font-medium">{s.nombre}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{s.boletos_vendidos} boletos</span>
                  <EstadoBadge estado={s.estado} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <article className="rounded-md border border-primary/20 bg-card/80 p-5">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground truncate">{note}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    ACTIVO: "bg-green-500/15 text-green-400",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    CERRADO: "bg-zinc-500/15 text-zinc-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[estado] ?? ""}`}>
      {estado}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-md bg-secondary" />)}
      </div>
      <div className="h-48 rounded-md bg-secondary" />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{msg}</div>
  );
}
