import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { comprasApi, payphoneApi, type MetodoPago } from "@/lib/api";

interface PurchaseConfirmationState {
  nombre: string;
  email: string;
  sorteoNombre: string;
  boletos?: { id: string; numero: number }[];
  pendiente: boolean;
  compraId?: string;
  metodoPago?: MetodoPago;
}

const PAYPHONE_CONFIRM_RETRIES = 12;
const PAYPHONE_CONFIRM_RETRY_DELAY_MS = 2000;

function readStoredConfirmation(): PurchaseConfirmationState | null {
  try {
    const raw = sessionStorage.getItem("lastPurchaseConfirmation");
    return raw ? (JSON.parse(raw) as PurchaseConfirmationState) : null;
  } catch {
    return null;
  }
}

function clearStoredPayphoneContext() {
  sessionStorage.removeItem("lastPayphoneCompraId");
  sessionStorage.removeItem("lastPayphoneContext");
  sessionStorage.removeItem("lastPayphoneTransactionId");
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readPayphoneRedirectParams(search: string): { compraId: string; transactionId: number } | null {
  const params = new URLSearchParams(search);
  const compraId = params.get("clientTransactionId");
  const transactionIdRaw = params.get("id");
  const transactionId = transactionIdRaw ? Number(transactionIdRaw) : NaN;

  if (!compraId || !Number.isFinite(transactionId) || transactionId <= 0) {
    return null;
  }

  return { compraId, transactionId };
}

function readStoredPayphoneContext(): {
  compraId: string;
  nombre: string;
  email: string;
  sorteoNombre: string;
  transactionId?: number;
} | null {
  try {
    const compraId = sessionStorage.getItem("lastPayphoneCompraId");
    const ctx = sessionStorage.getItem("lastPayphoneContext");
    if (!compraId || !ctx) return null;
    const transactionIdRaw = sessionStorage.getItem("lastPayphoneTransactionId");
    const transactionId = transactionIdRaw ? Number(transactionIdRaw) : undefined;
    return { compraId, transactionId: Number.isFinite(transactionId) ? transactionId : undefined, ...JSON.parse(ctx) };
  } catch {
    return null;
  }
}

const PurchaseConfirmation = () => {
  const location = useLocation();
  const payphoneRedirect = readPayphoneRedirectParams(location.search);
  // Si hay un compraId de Payphone pendiente de recuperar, NO leer el sessionStorage de confirmación
  // (podría ser de una transferencia anterior) — dejar que el useEffect lo recupere del backend.
  const hasPendingPayphone = Boolean(payphoneRedirect || sessionStorage.getItem("lastPayphoneCompraId"));
  const [confirmation, setConfirmation] = useState<PurchaseConfirmationState | null>(
    () => {
      const fromNav = location.state as PurchaseConfirmationState | null;
      if (payphoneRedirect) return null;
      if (fromNav) return fromNav;
      if (hasPendingPayphone) return null; // forzar recuperación desde backend
      return readStoredConfirmation();
    },
  );
  const [loadingRecovery, setLoadingRecovery] = useState(false);

  useEffect(() => {
    if (confirmation) return;

    const redirectCtx = readPayphoneRedirectParams(location.search);
    const storedCtx = readStoredPayphoneContext();
    const compraId = redirectCtx?.compraId ?? storedCtx?.compraId;
    if (!compraId) return;

    const ctx = {
      compraId,
      nombre: storedCtx?.nombre ?? "",
      email: storedCtx?.email ?? "",
      sorteoNombre: storedCtx?.sorteoNombre ?? "",
      transactionId: redirectCtx?.transactionId ?? storedCtx?.transactionId,
    };

    if (redirectCtx) {
      sessionStorage.setItem("lastPayphoneCompraId", redirectCtx.compraId);
      sessionStorage.setItem("lastPayphoneTransactionId", String(redirectCtx.transactionId));
      if (!storedCtx) {
        sessionStorage.setItem(
          "lastPayphoneContext",
          JSON.stringify({
            nombre: "",
            email: "",
            sorteoNombre: "",
          }),
        );
      }
    }

    let cancelled = false;
    setLoadingRecovery(true);

    const buildConfirmationFromCompra = (compra: Awaited<ReturnType<typeof comprasApi.obtener>>): PurchaseConfirmationState => ({
      nombre: compra.comprador_nombre ?? ctx.nombre,
      email: compra.email ?? ctx.email,
      sorteoNombre: ctx.sorteoNombre,
      pendiente: compra.estado_pago !== "VALIDADO",
      boletos: (compra.boletos ?? []).map((b) => ({ id: b.id, numero: b.numero })),
      compraId: compra.id,
      metodoPago: compra.metodo_pago,
    });

    const recoverPurchase = async () => {
      try {
        if (ctx.transactionId) {
          for (let attempt = 1; attempt <= PAYPHONE_CONFIRM_RETRIES; attempt += 1) {
            try {
              const result = await payphoneApi.confirmar(ctx.transactionId, ctx.compraId);
              const recovered: PurchaseConfirmationState = {
                nombre: result.compra?.comprador_nombre ?? ctx.nombre,
                email: result.compra?.email ?? ctx.email,
                sorteoNombre: ctx.sorteoNombre,
                pendiente: false,
                boletos: (result.boletos ?? []).map((b) => ({ id: b.id, numero: b.numero })),
                compraId: result.compra?.id ?? ctx.compraId,
                metodoPago: "TARJETA",
              };

              if (cancelled) return;
              sessionStorage.setItem("lastPurchaseConfirmation", JSON.stringify(recovered));
              clearStoredPayphoneContext();
              setConfirmation(recovered);
              return;
            } catch {
              const compra = await comprasApi.obtener(ctx.compraId).catch(() => null);
              if (compra?.estado_pago === "VALIDADO") {
                const recovered = buildConfirmationFromCompra(compra);
                if (cancelled) return;
                sessionStorage.setItem("lastPurchaseConfirmation", JSON.stringify(recovered));
                clearStoredPayphoneContext();
                setConfirmation(recovered);
                return;
              }

              if (attempt < PAYPHONE_CONFIRM_RETRIES) {
                await wait(PAYPHONE_CONFIRM_RETRY_DELAY_MS);
                continue;
              }

              if (compra) {
                const recovered = buildConfirmationFromCompra(compra);
                if (cancelled) return;
                sessionStorage.setItem("lastPurchaseConfirmation", JSON.stringify(recovered));
                setConfirmation(recovered);
                return;
              }

              throw new Error("No se pudo confirmar la compra con Payphone.");
            }
          }
        }

        const compra = await comprasApi.obtener(ctx.compraId);
        const recovered = buildConfirmationFromCompra(compra);

        if (cancelled) return;
        sessionStorage.setItem("lastPurchaseConfirmation", JSON.stringify(recovered));
        if (compra.metodo_pago === "TRANSFERENCIA" || compra.estado_pago === "VALIDADO") {
          clearStoredPayphoneContext();
        }
        setConfirmation(recovered);
      } catch {
        if (!cancelled && !ctx.transactionId) {
          clearStoredPayphoneContext();
        }
      } finally {
        if (!cancelled) {
          setLoadingRecovery(false);
        }
      }
    };

    void recoverPurchase();

    return () => {
      cancelled = true;
    };
  }, [confirmation, location.search]);

  const isPendiente = confirmation?.pendiente === true;
  const isTransferenciaPendiente = isPendiente && confirmation?.metodoPago === "TRANSFERENCIA";
  const isTarjetaProcesando = isPendiente && confirmation?.metodoPago === "TARJETA";

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <section className="relative flex min-h-screen items-center overflow-hidden px-4 py-5 sm:py-6">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background to-background" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-full max-w-5xl rounded-2xl border border-primary/30 bg-card/75 p-5 text-center shadow-luxury backdrop-blur-xl sm:p-6"
        >
          {loadingRecovery ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : isPendiente ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-amber-400 text-amber-400 sm:h-18 sm:w-18">
              <Clock className="h-8 w-8 stroke-[3]" />
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-primary text-primary sm:h-18 sm:w-18">
              <Check className="h-8 w-8 stroke-[4]" />
            </div>
          )}

          {loadingRecovery ? (
            <p className="mt-5 text-foreground/60">Verificando tu compra...</p>
          ) : confirmation ? (
            isTransferenciaPendiente ? (
              <>
                <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl" style={{ color: "#f4d469" }}>
                  Compra en revisión
                </h1>
                <p className="mx-auto mt-3 max-w-4xl text-base leading-relaxed text-foreground/70 sm:text-lg">
                  Hola <strong>{confirmation.nombre}</strong>, recibimos tu comprobante de transferencia para{" "}
                  <strong>{confirmation.sorteoNombre}</strong>.
                </p>
                <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-foreground/55 sm:text-base">
                  Tu compra está en espera de validación. Una vez que el administrador apruebe el comprobante, recibirás tus números asignados en el correo <strong>{confirmation.email}</strong>.
                </p>
                {confirmation.compraId && (
                  <div className="mx-auto mt-5 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-xs text-amber-300/70 uppercase tracking-widest mb-1">ID de tu compra</p>
                    <p className="font-mono text-xs text-amber-200 break-all">{confirmation.compraId}</p>
                  </div>
                )}
                <div className="mx-auto mt-5 max-w-lg rounded-lg border border-border bg-secondary/40 p-4 text-sm text-foreground/60 leading-relaxed">
                  Guarda este correo como referencia. El proceso de validación puede tomar algunas horas.
                </div>
              </>
            ) : isTarjetaProcesando ? (
              <>
                <h1 className="mt-5 font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
                  Pago aprobado, procesando compra
                </h1>
                <p className="mx-auto mt-3 max-w-4xl text-base leading-relaxed text-foreground/70 sm:text-lg">
                  Hola <strong>{confirmation.nombre}</strong>, tu pago con tarjeta ya fue recibido y estamos terminando de aprobar la compra para <strong>{confirmation.sorteoNombre}</strong>.
                </p>
                <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-foreground/55 sm:text-base">
                  Estamos asignando tus boletos y enviando la información al correo <strong>{confirmation.email}</strong>. Si esta pantalla no se actualiza en unos instantes, revisa tu correo o vuelve a cargar la página.
                </p>
                {confirmation.compraId && (
                  <div className="mx-auto mt-5 max-w-md rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                    <p className="mb-1 text-xs uppercase tracking-widest text-primary/70">ID de tu compra</p>
                    <p className="break-all font-mono text-xs text-primary">{confirmation.compraId}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="mt-5 font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
                  ¡Compra exitosa y aprobada!
                </h1>
                <p className="mx-auto mt-3 max-w-4xl text-base leading-relaxed text-foreground/70 sm:text-lg">
                  Hola <strong>{confirmation.nombre}</strong>, tus boletos para <strong>{confirmation.sorteoNombre}</strong> fueron asignados y enviados al correo{" "}
                  <strong>{confirmation.email}</strong>. ¡Mucha suerte!
                </p>
                {confirmation.boletos && confirmation.boletos.length > 0 && (
                  <div className="mx-auto mt-5 max-w-2xl rounded-lg border border-primary/30 bg-primary/5 px-4 py-4">
                    <p className="text-xs text-primary/70 uppercase tracking-widest mb-3">Tus boletos</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {confirmation.boletos.map((b) => (
                        <span
                          key={b.id}
                          className="inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary"
                        >
                          {b.numero}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mx-auto mt-4 max-w-4xl text-sm leading-relaxed text-foreground/55 sm:text-base">
                  Conserva el correo de confirmación. Allí encontrarás tus boletos y el CÓDIGO ÚNICO para verificar y reclamar premios.
                </p>
              </>
            )
          ) : (
            <>
              <h1 className="mt-5 font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
                Compra registrada
              </h1>
              <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-foreground/70 sm:text-lg">
                No encontramos el detalle de la compra en esta sesión. Revisa tu correo electrónico para ver el estado de tu compra.
              </p>
            </>
          )}

          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold-gradient px-7 py-3 font-bold text-primary-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Comprar más boletos
          </Link>
        </motion.div>
      </section>
    </main>
  );
};

export default PurchaseConfirmation;
