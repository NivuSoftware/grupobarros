import { FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { getErrorMessage, notifyError, notifySuccess } from "@/lib/alerts";
import { comprasApi, uploadApi } from "@/lib/api";
import { isValidEcuadorianCedula } from "@/lib/cedulaEcuatoriana";
import { useSorteoActivo } from "@/lib/useSorteoActivo";

const TICKET_PRICE = 2;
const MIN_TICKETS = 3;

const formatMoney = (value: number) => `$${value.toLocaleString("es-EC")}`;
const normalizeQuantity = (value: number) => Math.max(MIN_TICKETS, Math.trunc(value));

const emptyForm = {
  nombre: "",
  cedula: "",
  telefono: "",
  email: "",
  direccion: "",
};

type MetodoPago = "TARJETA" | "TRANSFERENCIA";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuantity = useMemo(() => {
    const value = Number(searchParams.get("cantidad"));
    return Number.isFinite(value) ? normalizeQuantity(value) : MIN_TICKETS;
  }, [searchParams]);

  const { data, loading } = useSorteoActivo();
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [cedulaTouched, setCedulaTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("TRANSFERENCIA");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(parsedQuantity) ? normalizeQuantity(parsedQuantity) : MIN_TICKETS;
  const total = safeQuantity * TICKET_PRICE;
  const activeSorteo = data?.sorteo;
  const availableTickets = data?.stats.disponibles ?? 0;
  const cedula = form.cedula.trim();
  const isCedulaValid = isValidEcuadorianCedula(cedula);
  const shouldShowCedulaError = cedulaTouched && cedula.length > 0 && !isCedulaValid;
  const cedulaErrorMessage =
    cedula.length < 10
      ? "La cédula debe tener 10 dígitos."
      : "Ingresa una cédula ecuatoriana válida.";

  const comprobanteRequerido = metodoPago === "TRANSFERENCIA" && !comprobante;
  const canBuy =
    !!activeSorteo &&
    safeQuantity <= availableTickets &&
    accepted &&
    isCedulaValid &&
    !submitting &&
    !uploadingComprobante &&
    !comprobanteRequerido;

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notifyError("Archivo muy grande", "El comprobante no puede superar 10 MB.");
      return;
    }
    setComprobante(file);
    setComprobantePreview(URL.createObjectURL(file));
  };

  const removeComprobante = () => {
    setComprobante(null);
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeSorteo) {
      notifyError("No hay sorteo activo", "La compra estará disponible cuando exista una actividad activa.");
      return;
    }

    if (safeQuantity > availableTickets) {
      notifyError("Boletos insuficientes", `Solo hay ${availableTickets.toLocaleString("es-EC")} boletos disponibles.`);
      return;
    }

    if (!accepted) {
      notifyError("Acepta los términos", "Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    if (!isValidEcuadorianCedula(form.cedula)) {
      notifyError("Cédula inválida", "Ingresa una cédula ecuatoriana válida para continuar.");
      return;
    }

    if (metodoPago === "TRANSFERENCIA" && !comprobante) {
      notifyError("Comprobante requerido", "Debes adjuntar la foto del comprobante de transferencia.");
      return;
    }

    setSubmitting(true);
    try {
      let comprobanteUrl: string | undefined;

      if (metodoPago === "TRANSFERENCIA" && comprobante) {
        setUploadingComprobante(true);
        try {
          comprobanteUrl = await uploadApi.upload(comprobante);
        } finally {
          setUploadingComprobante(false);
        }
      }

      const result = await comprasApi.crear({
        sorteoId: activeSorteo.id,
        cantidadBoletos: safeQuantity,
        comprador: {
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          direccion: form.direccion.trim() || undefined,
        },
        metodoPago,
        comprobanteUrl,
      });

      if (result.pendiente) {
        notifySuccess(
          "Compra registrada",
          "Tu comprobante está siendo revisado. Te enviaremos los boletos por correo cuando sea aprobado.",
        );
        navigate("/compra-confirmada", {
          replace: true,
          state: {
            nombre: result.comprador.nombre,
            email: result.comprador.email,
            sorteoNombre: activeSorteo.nombre,
            pendiente: true,
            compraId: result.compra.id,
          },
        });
      } else {
        const confirmation = {
          nombre: result.comprador.nombre,
          email: result.comprador.email,
          sorteoNombre: activeSorteo.nombre,
          boletos: result.boletos.map((boleto) => ({
            id: boleto.id,
            numero: boleto.numero,
          })),
          pendiente: false,
        };
        sessionStorage.setItem("lastPurchaseConfirmation", JSON.stringify(confirmation));
        notifySuccess("Compra registrada", "Tus boletos fueron asignados correctamente.");
        navigate("/compra-confirmada", { replace: true, state: confirmation });
      }
    } catch (error) {
      notifyError(getErrorMessage(error, "No se pudo completar la compra."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = () => {
    if (uploadingComprobante) return "Subiendo comprobante...";
    if (submitting) return "Registrando compra...";
    if (metodoPago === "TRANSFERENCIA") return `Enviar comprobante y reservar ${safeQuantity} boletos`;
    return `Pagar con tarjeta (próximamente)`;
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar sorteoData={data} loading={loading} />

      <section className="relative overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background to-background" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <CreditCard className="h-4 w-4" />
              Compra segura
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              Finaliza tu <span className="text-gold-gradient">compra</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Ingresa tus datos y elige cómo deseas pagar.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1fr_380px]">
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="order-2 rounded-lg border border-border bg-card/80 p-5 backdrop-blur-xl sm:p-7 space-y-7 lg:order-1"
            >
              {/* Datos de facturación */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Datos de facturación</h2>
                    <p className="text-sm text-muted-foreground">Usaremos esta información para registrar la compra.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre completo" icon={<User className="h-4 w-4" />}>
                    <input
                      required
                      minLength={2}
                      value={form.nombre}
                      onChange={(event) => updateField("nombre", event.target.value)}
                      className="checkout-input"
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Cédula" icon={<ReceiptText className="h-4 w-4" />}>
                    <input
                      required
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      value={form.cedula}
                      onChange={(event) => updateField("cedula", event.target.value.replace(/\D/g, ""))}
                      onInvalid={(event) => {
                        event.currentTarget.setCustomValidity("Ingresa una cédula ecuatoriana válida.");
                      }}
                      onInput={(event) => {
                        event.currentTarget.setCustomValidity("");
                      }}
                      onBlur={() => setCedulaTouched(true)}
                      className="checkout-input"
                      aria-invalid={shouldShowCedulaError}
                      autoComplete="off"
                    />
                    {shouldShowCedulaError && (
                      <p className="mt-2 text-xs text-destructive">{cedulaErrorMessage}</p>
                    )}
                  </Field>

                  <Field label="Teléfono" icon={<Phone className="h-4 w-4" />}>
                    <input
                      required
                      value={form.telefono}
                      onChange={(event) => updateField("telefono", event.target.value)}
                      className="checkout-input"
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Correo electrónico" icon={<Mail className="h-4 w-4" />}>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className="checkout-input"
                      placeholder="correo@dominio.com"
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Dirección" icon={<MapPin className="h-4 w-4" />}>
                    <input
                      value={form.direccion}
                      onChange={(event) => updateField("direccion", event.target.value)}
                      className="checkout-input"
                      placeholder="Tu dirección (para la factura)"
                      autoComplete="street-address"
                    />
                  </Field>
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground/80">Método de pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <MetodoPagoCard
                    activo={metodoPago === "TRANSFERENCIA"}
                    onClick={() => setMetodoPago("TRANSFERENCIA")}
                    icon={<Building2 className="h-6 w-6" />}
                    titulo="Transferencia bancaria"
                    descripcion="Adjunta tu comprobante"
                  />
                  <MetodoPagoCard
                    activo={metodoPago === "TARJETA"}
                    onClick={() => setMetodoPago("TARJETA")}
                    icon={<CreditCard className="h-6 w-6" />}
                    titulo="Tarjeta de crédito"
                    descripcion="Próximamente"
                    disabled
                  />
                </div>
              </div>

              {/* Upload comprobante (solo para transferencia) */}
              <AnimatePresence>
                {metodoPago === "TRANSFERENCIA" && (
                  <motion.div
                    key="comprobante"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-primary/30 bg-secondary/30 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground/80">
                          Comprobante de transferencia <span className="text-destructive">*</span>
                        </p>
                      </div>
                      <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                        Adjunta la foto o captura del comprobante de tu transferencia bancaria. Tu compra quedará en espera hasta que el administrador valide el pago.
                      </p>

                      {comprobantePreview ? (
                        <div className="relative">
                          <img
                            src={comprobantePreview}
                            alt="Comprobante"
                            className="w-full max-h-64 object-contain rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={removeComprobante}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-background/50 px-4 py-8 text-center transition-colors hover:border-primary/60 hover:bg-background/80">
                          <ImageIcon className="h-8 w-8 text-primary/50" />
                          <span className="text-sm font-semibold text-foreground/70">Haz clic para subir el comprobante</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG o PDF · Máx. 10 MB</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleComprobanteChange}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Términos */}
              <div className="rounded-lg border border-primary/20 bg-secondary/40 p-4">
                <label className="flex items-start gap-3 text-left text-sm leading-relaxed text-foreground/75">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    Acepto los{" "}
                    <Link to="/terminos-y-condiciones" className="font-semibold text-primary underline-offset-4 hover:underline">
                      términos y condiciones
                    </Link>{" "}
                    de Grupo Barros.
                  </span>
                </label>
              </div>

              {metodoPago === "TRANSFERENCIA" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-300">
                  <strong>Importante:</strong> Al pagar por transferencia, tus boletos serán asignados una vez que el administrador valide tu comprobante. Recibirás los números por correo electrónico.
                </div>
              )}

              <button
                type="submit"
                disabled={!canBuy}
                className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-gold-gradient px-8 font-bold text-primary-foreground shadow-gold transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitLabel()}
              </button>
            </motion.form>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="order-1 h-fit rounded-lg border border-primary/30 bg-card/80 p-5 backdrop-blur-xl sm:p-6 lg:order-2"
            >
              <h2 className="font-display text-2xl font-bold text-gold-gradient">Resumen</h2>

              {loading ? (
                <div className="mt-5 space-y-3 animate-pulse">
                  <div className="h-5 rounded bg-secondary" />
                  <div className="h-12 rounded bg-secondary" />
                  <div className="h-20 rounded bg-secondary" />
                </div>
              ) : activeSorteo ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/70">{activeSorteo.nombre}</p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="checkoutQuantity" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Boletos
                      </label>
                      <input
                        id="checkoutQuantity"
                        type="number"
                        min={MIN_TICKETS}
                        max={availableTickets}
                        step={1}
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        onBlur={() => setQuantity(String(safeQuantity))}
                        className="mt-2 h-12 w-full rounded-lg border border-primary/30 bg-background px-4 text-center text-xl font-bold text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <SummaryRow label="Valor por boleto" value={formatMoney(TICKET_PRICE)} />
                    <SummaryRow label="Cantidad" value={`x${safeQuantity}`} />

                    <div className="border-t border-border pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                        <span className="font-display text-5xl font-bold text-gold-gradient">{formatMoney(total)}</span>
                      </div>
                    </div>
                  </div>

                  {safeQuantity > availableTickets && (
                    <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      La cantidad supera los boletos disponibles.
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-lg border border-primary/20 bg-secondary/40 p-4 text-sm leading-relaxed text-foreground/70">
                  No hay un sorteo activo en este momento. La compra estará disponible cuando se publique una actividad.
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-foreground/70">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>Los números se asignan automáticamente y no se repiten dentro del sorteo activo.</p>
              </div>

              <Link
                to="/#packs"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 px-5 py-3 font-semibold text-foreground transition-colors hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 text-primary" />
                Cambiar cantidad
              </Link>
            </motion.aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

function MetodoPagoCard({
  activo,
  onClick,
  icon,
  titulo,
  descripcion,
  disabled = false,
}: {
  activo: boolean;
  onClick: () => void;
  icon: ReactNode;
  titulo: string;
  descripcion: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-border opacity-40"
          : activo
          ? "border-primary bg-primary/10 shadow-gold"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span className={activo && !disabled ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="font-semibold text-sm">{titulo}</span>
      <span className="text-xs text-muted-foreground">{descripcion}</span>
      {activo && !disabled && (
        <span className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <span className="h-2 w-2 rounded-full bg-primary-foreground" />
        </span>
      )}
    </button>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default Checkout;
