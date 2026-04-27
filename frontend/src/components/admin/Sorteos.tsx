import { useEffect, useState } from "react";
import { Plus, Pencil, Rocket, X, ChevronDown, ChevronUp, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmAction, getErrorMessage, notifyError, notifySuccess } from "@/lib/alerts";
import {
  sorteoApi,
  neApi,
  type Sorteo,
  type NumeroEspecial,
  type TipoNumeroEspecial,
  type NumeroEspecialColor,
} from "@/lib/api";
import {
  getNumeroEspecialBadgeLabel,
  getNumeroEspecialColorTheme,
  NUMERO_ESPECIAL_COLOR_OPTIONS,
} from "@/lib/numeroEspecialTheme";
import ImageUpload from "./ImageUpload";

export default function Sorteos() {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCrear, setShowCrear] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setSorteos(await sorteoApi.listar());
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Error al cargar sorteos");
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const flash = (msg: string, type: "success" | "error" = "success") => {
    if (type === "error") notifyError(msg);
    else notifySuccess(msg);
  };

  const handlePublicar = async (id: string) => {
    try {
      await sorteoApi.publicar(id);
      flash("Sorteo publicado exitosamente");
      reload();
    } catch (e: unknown) { flash(getErrorMessage(e, "Error"), "error"); }
  };

  const handleCerrar = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Cerrar sorteo",
      text: "Esta acción cerrará el sorteo manualmente.",
      confirmButtonText: "Cerrar sorteo",
    });
    if (!confirmed) return;
    try {
      await sorteoApi.cerrar(id);
      flash("Sorteo cerrado");
      reload();
    } catch (e: unknown) { flash(getErrorMessage(e, "Error"), "error"); }
  };

  const handleEliminar = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Eliminar sorteo",
      text: "Esta acción eliminará el sorteo y todos sus datos. No se puede deshacer.",
      confirmButtonText: "Eliminar",
    });
    if (!confirmed) return;
    try {
      await sorteoApi.eliminar(id);
      flash("Sorteo eliminado");
      reload();
    } catch (e: unknown) { flash(getErrorMessage(e, "Error"), "error"); }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Gestión</p>
          <h1 className="mt-2 text-3xl font-extrabold">Sorteos</h1>
        </div>
        <Button onClick={() => setShowCrear(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo sorteo
        </Button>
      </div>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

      {showCrear && (
        <CrearSorteoForm
          onCreated={() => { setShowCrear(false); reload(); flash("Sorteo creado en DRAFT"); }}
          onCancel={() => setShowCrear(false)}
        />
      )}

      {sorteos.length === 0 ? (
        <div className="rounded-md border border-dashed border-primary/20 p-8 text-center text-muted-foreground">
          No hay sorteos. Crea el primero.
        </div>
      ) : (
        <div className="space-y-3">
          {sorteos.map((s) => (
            <SorteoCard
              key={s.id}
              sorteo={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
              onPublicar={handlePublicar}
              onCerrar={handleCerrar}
              onEliminar={handleEliminar}
              onReload={reload}
              flash={flash}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de sorteo ───────────────────────────────────────────────────────────

function SorteoCard({
  sorteo, expanded, onToggle, onPublicar, onCerrar, onEliminar, onReload, flash,
}: {
  sorteo: Sorteo;
  expanded: boolean;
  onToggle: () => void;
  onPublicar: (id: string) => void;
  onCerrar: (id: string) => void;
  onEliminar: (id: string) => void;
  onReload: () => void;
  flash: (m: string, type?: "success" | "error") => void;
}) {
  const [ne, setNe] = useState<NumeroEspecial[]>([]);
  const [neLoading, setNeLoading] = useState(false);
  const [showAddNe, setShowAddNe] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setNeLoading(true);
    neApi.listar(sorteo.id).then(setNe).finally(() => setNeLoading(false));
  }, [expanded, sorteo.id]);

  const reloadNe = () => neApi.listar(sorteo.id).then(setNe);

  const estadoColors: Record<string, string> = {
    ACTIVO: "bg-green-500/15 text-green-400",
    DRAFT: "bg-yellow-500/15 text-yellow-400",
    CERRADO: "bg-zinc-500/15 text-zinc-400",
  };

  return (
    <div className="rounded-md border border-primary/20 bg-card/80 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-background/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${estadoColors[sorteo.estado]}`}>
            {sorteo.estado}
          </span>
          <span className="font-semibold truncate">{sorteo.nombre}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {sorteo.boletos_vendidos} boletos vendidos
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-primary/20 px-5 py-4 space-y-5">
          {editing ? (
            <EditarSorteoForm
              sorteo={sorteo}
              onSaved={() => { setEditing(false); onReload(); flash("Sorteo actualizado"); }}
              onCancel={() => setEditing(false)}
              flash={flash}
            />
          ) : (
            <>
              {/* Imágenes del premio mayor */}
              {sorteo.premio_mayor_imagenes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sorteo.premio_mayor_imagenes.map((url) => (
                    <img key={url} src={url} alt="Premio" className="h-24 w-auto rounded-md object-cover border border-primary/20" />
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <Info label="Premio mayor" value={sorteo.premio_mayor_nombre} />
                <Info label="Rango boletos" value={`0 a ${sorteo.numero_maximo_boletos.toLocaleString()}`} />
                <Info label="Ganador mayor" value={sorteo.premio_mayor_boleto_id ? "Declarado" : "Pendiente"} />
                {sorteo.descripcion && <Info label="Descripción" value={sorteo.descripcion} />}
                {sorteo.premio_mayor_descripcion && (
                  <Info label="Desc. premio mayor" value={sorteo.premio_mayor_descripcion} />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {sorteo.estado === "DRAFT" && (
                  <>
                    <Button size="sm" variant="default" className="gap-1" onClick={() => onPublicar(sorteo.id)}>
                      <Rocket className="h-3 w-3" /> Publicar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(true)}>
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                      onClick={() => onEliminar(sorteo.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </Button>
                  </>
                )}
                {sorteo.estado === "ACTIVO" && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => onCerrar(sorteo.id)}>
                    <X className="h-3 w-3" /> Cerrar manualmente
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Números especiales */}
          {!editing && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Números especiales</h3>
                {sorteo.estado === "DRAFT" && (
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setShowAddNe(true)}>
                    <Plus className="h-3 w-3" /> Agregar
                  </Button>
                )}
              </div>

              {neLoading ? (
                <div className="text-xs text-muted-foreground">Cargando…</div>
              ) : (
                <div className="space-y-2">
                  {ne.map((n) => (
                    <NumeroEspecialRow key={n.id} ne={n} sorteo={sorteo} onReload={reloadNe} flash={flash} />
                  ))}
                  {ne.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin números especiales configurados.</p>
                  )}
                </div>
              )}

              {showAddNe && (
                <AddNumeroEspecialForm
                  sorteoId={sorteo.id}
                  maxBoleto={sorteo.numero_maximo_boletos}
                  onAdded={() => { setShowAddNe(false); reloadNe(); flash("Número especial agregado"); }}
                  onCancel={() => setShowAddNe(false)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulario editar sorteo ─────────────────────────────────────────────────

function EditarSorteoForm({
  sorteo, onSaved, onCancel, flash,
}: {
  sorteo: Sorteo;
  onSaved: () => void;
  onCancel: () => void;
  flash: (m: string, type?: "success" | "error") => void;
}) {
  const [form, setForm] = useState({
    nombre: sorteo.nombre,
    descripcion: sorteo.descripcion ?? "",
    numeroMaximoBoletos: String(sorteo.numero_maximo_boletos),
    premioMayorNombre: sorteo.premio_mayor_nombre,
    premioMayorDescripcion: sorteo.premio_mayor_descripcion ?? "",
  });
  const [imagenes, setImagenes] = useState<string[]>(sorteo.premio_mayor_imagenes ?? []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await sorteoApi.editar(sorteo.id, {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        numeroMaximoBoletos: Number(form.numeroMaximoBoletos),
        premioMayorNombre: form.premioMayorNombre,
        premioMayorDescripcion: form.premioMayorDescripcion || undefined,
        premioMayorImagenes: imagenes,
      });
      onSaved();
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Error al guardar"));
      flash(getErrorMessage(e, "Error al guardar"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-bold">Editar sorteo</p>
      {err && <p className="text-xs text-red-400">{err}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del sorteo *">
          <input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className="input-base" />
        </Field>
        <Field label="Número máximo de boletos *">
          <input required type="number" value={form.numeroMaximoBoletos}
            onChange={(e) => set("numeroMaximoBoletos", e.target.value)}
            className="input-base" min={9} />
        </Field>
        <Field label="Premio mayor *">
          <input required value={form.premioMayorNombre}
            onChange={(e) => set("premioMayorNombre", e.target.value)} className="input-base" />
        </Field>
        <Field label="Descripción del sorteo">
          <input value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} className="input-base" />
        </Field>
      </div>
      <Field label="Descripción del premio mayor">
        <input value={form.premioMayorDescripcion}
          onChange={(e) => set("premioMayorDescripcion", e.target.value)} className="input-base" />
      </Field>

      {/* Imágenes premio mayor (hasta 5) */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Imágenes del premio mayor ({imagenes.length}/5)
        </p>
        <div className="flex flex-wrap gap-3">
          {imagenes.map((url, i) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="h-24 w-24 rounded-md object-cover border border-primary/20" />
              <button
                type="button"
                onClick={() => setImagenes((imgs) => imgs.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-card border border-primary/30 p-0.5 text-muted-foreground hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {imagenes.length < 5 && (
            <ImageUpload
              onChange={(url) => { if (url) setImagenes((imgs) => [...imgs, url]); }}
              label=""
              className="w-24"
            />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="gap-1">
          <Save className="h-3 w-3" />{saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// ─── Fila de número especial ──────────────────────────────────────────────────

function NumeroEspecialRow({
  ne, sorteo, onReload, flash,
}: {
  ne: NumeroEspecial;
  sorteo: Sorteo;
  onReload: () => void;
  flash: (m: string, type?: "success" | "error") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [numero, setNumero] = useState(ne.numero >= 0 ? String(ne.numero) : "");
  const [nombrePremio, setNombrePremio] = useState(ne.nombre_premio ?? "");
  const [imagen, setImagen] = useState<string | undefined>(ne.imagen);
  const [color, setColor] = useState<NumeroEspecialColor>(ne.color ?? "ORANGE");
  const [saving, setSaving] = useState(false);

  const colorTheme = ne.tipo === "NARANJA" ? getNumeroEspecialColorTheme(color) : null;
  const isPH = ne.numero < 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await neApi.editar(sorteo.id, ne.id, {
        numero: Number(numero),
        nombrePremio: nombrePremio || undefined,
        imagen: imagen || undefined,
        color: ne.tipo === "NARANJA" ? color : undefined,
      });
      onReload();
      setEditing(false);
      flash("Número especial actualizado");
    } catch (e: unknown) {
      flash(getErrorMessage(e, "Error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Eliminar número especial",
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Eliminar",
    });
    if (!confirmed) return;
    try {
      await neApi.eliminar(sorteo.id, ne.id);
      onReload();
      flash("Número especial eliminado");
    } catch (e: unknown) { flash(getErrorMessage(e, "Error"), "error"); }
  };

  return (
    <div className="rounded-md bg-background/70 px-3 py-2 text-sm">
      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {ne.tipo === "ORO" ? (
              <span className="font-bold text-xs uppercase text-yellow-400">{ne.tipo}</span>
            ) : (
              <span
                className="rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: colorTheme?.accent, borderColor: colorTheme?.accentSoft, background: colorTheme?.cardBackground }}
              >
                {getNumeroEspecialBadgeLabel(ne.tipo, color)}
              </span>
            )}
            <input
              type="number" value={numero} onChange={(e) => setNumero(e.target.value)}
              placeholder="Número" min={0} max={sorteo.numero_maximo_boletos}
              className="w-24 rounded border border-primary/30 bg-background px-2 py-1 text-xs"
            />
            <input
              type="text" value={nombrePremio} onChange={(e) => setNombrePremio(e.target.value)}
              placeholder="Nombre del premio (opcional)"
              className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-2 py-1 text-xs"
            />
            {ne.tipo === "NARANJA" && (
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as NumeroEspecialColor)}
                className="rounded border border-primary/30 bg-background px-2 py-1 text-xs"
              >
                {NUMERO_ESPECIAL_COLOR_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.adminLabel}</option>
                ))}
              </select>
            )}
          </div>
          <ImageUpload value={imagen} onChange={setImagen} label="Imagen del premio (opcional)" />
          <div className="flex gap-2">
            <Button size="sm" className="h-6 text-xs" disabled={saving} onClick={handleSave}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          {ne.tipo === "ORO" ? (
            <span className="font-bold text-xs uppercase text-yellow-400">{ne.tipo}</span>
          ) : (
            <span
              className="rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                color: getNumeroEspecialColorTheme(ne.color).accent,
                borderColor: getNumeroEspecialColorTheme(ne.color).accentSoft,
                background: getNumeroEspecialColorTheme(ne.color).cardBackground,
              }}
            >
              {getNumeroEspecialBadgeLabel(ne.tipo, ne.color)}
            </span>
          )}
          {ne.imagen && (
            <img src={ne.imagen} alt="" className="h-8 w-8 rounded object-cover border border-primary/20" />
          )}
          <span className={`font-mono font-semibold ${isPH ? "text-muted-foreground italic" : ""}`}>
            {isPH ? "sin número" : String(ne.numero).padStart(4, "0")}
          </span>
          {ne.nombre_premio && <span className="text-muted-foreground flex-1 truncate">{ne.nombre_premio}</span>}
          {ne.es_ganador && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">Ganador declarado</span>}
          {sorteo.estado === "DRAFT" && (
            <div className="ml-auto flex gap-1">
              <button type="button" onClick={() => setEditing(true)} className="p-1 hover:text-primary text-muted-foreground">
                <Pencil className="h-3 w-3" />
              </button>
              <button type="button" onClick={handleDelete} className="p-1 hover:text-red-400 text-muted-foreground">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulario agregar número especial ──────────────────────────────────────

function AddNumeroEspecialForm({
  sorteoId, maxBoleto, onAdded, onCancel,
}: {
  sorteoId: string;
  maxBoleto: number;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState<TipoNumeroEspecial>("ORO");
  const [color, setColor] = useState<NumeroEspecialColor>("ORANGE");
  const [nombrePremio, setNombrePremio] = useState("");
  const [imagen, setImagen] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await neApi.agregar(sorteoId, {
        numero: Number(numero),
        tipo,
        color: tipo === "NARANJA" ? color : undefined,
        nombrePremio: nombrePremio || undefined,
        imagen: imagen || undefined,
      });
      onAdded();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-md border border-primary/30 bg-background/50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Nuevo número especial</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <input
          required type="number" value={numero} onChange={(e) => setNumero(e.target.value)}
          placeholder={`Número de 0 a ${maxBoleto}`} min={0} max={maxBoleto}
          className="w-36 rounded border border-primary/30 bg-background px-3 py-2 text-sm"
        />
        <select
          value={tipo} onChange={(e) => setTipo(e.target.value as TipoNumeroEspecial)}
          className="rounded border border-primary/30 bg-background px-3 py-2 text-sm"
        >
          <option value="ORO">ORO</option>
          <option value="NARANJA">NARANJA</option>
        </select>
        {tipo === "NARANJA" && (
          <select
            value={color}
            onChange={(e) => setColor(e.target.value as NumeroEspecialColor)}
            className="rounded border border-primary/30 bg-background px-3 py-2 text-sm"
          >
            {NUMERO_ESPECIAL_COLOR_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.adminLabel}</option>
            ))}
          </select>
        )}
        <input
          type="text" value={nombrePremio} onChange={(e) => setNombrePremio(e.target.value)}
          placeholder="Nombre del premio (opcional)"
          className="flex-1 min-w-0 rounded border border-primary/30 bg-background px-3 py-2 text-sm"
        />
      </div>
      <ImageUpload value={imagen} onChange={setImagen} label="Imagen del premio (opcional)" />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Guardando…" : "Agregar"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// ─── Formulario crear sorteo ──────────────────────────────────────────────────

function CrearSorteoForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    nombre: "", descripcion: "", numeroMaximoBoletos: "",
    premioMayorNombre: "", premioMayorDescripcion: "",
  });
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await sorteoApi.crear({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        numeroMaximoBoletos: Number(form.numeroMaximoBoletos),
        premioMayorNombre: form.premioMayorNombre,
        premioMayorDescripcion: form.premioMayorDescripcion || undefined,
        premioMayorImagenes: imagenes,
      });
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al crear sorteo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-primary/30 bg-card/80 p-5">
      <h2 className="mb-4 font-bold text-lg">Nuevo sorteo</h2>
      {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del sorteo *" required>
            <input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
              className="input-base" placeholder="Ej: Gran Actividad 2025" />
          </Field>
          <Field label="Número máximo de boletos *" required>
            <input required type="number" value={form.numeroMaximoBoletos}
              onChange={(e) => set("numeroMaximoBoletos", e.target.value)}
              className="input-base" placeholder="Ej: 9999" min={9} />
          </Field>
          <Field label="Premio mayor *" required>
            <input required value={form.premioMayorNombre}
              onChange={(e) => set("premioMayorNombre", e.target.value)}
              className="input-base" placeholder="Ej: Yamaha R1 2025" />
          </Field>
          <Field label="Descripción del sorteo">
            <input value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)}
              className="input-base" placeholder="Opcional" />
          </Field>
        </div>
        <Field label="Descripción del premio mayor">
          <input value={form.premioMayorDescripcion}
            onChange={(e) => set("premioMayorDescripcion", e.target.value)}
            className="input-base" placeholder="Opcional" />
        </Field>

        {/* Imágenes premio mayor (hasta 5) */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Imágenes del premio mayor ({imagenes.length}/5)
          </p>
          <div className="flex flex-wrap gap-3">
            {imagenes.map((url, i) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-24 w-24 rounded-md object-cover border border-primary/20" />
                <button
                  type="button"
                  onClick={() => setImagenes((imgs) => imgs.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-card border border-primary/30 p-0.5 text-muted-foreground hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {imagenes.length < 5 && (
              <ImageUpload
                onChange={(url) => { if (url) setImagenes((imgs) => [...imgs, url]); }}
                label=""
                className="w-24"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear sorteo"}</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}{required && " *"}</label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-secondary" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-md bg-secondary" />)}
    </div>
  );
}
