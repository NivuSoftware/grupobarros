import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface PurchaseConfirmationState {
  nombre: string;
  email: string;
  sorteoNombre: string;
  boletos?: { id: string; numero: number }[];
  pendiente: boolean;
  compraId?: string;
}

function readStoredConfirmation(): PurchaseConfirmationState | null {
  try {
    const raw = sessionStorage.getItem("lastPurchaseConfirmation");
    return raw ? (JSON.parse(raw) as PurchaseConfirmationState) : null;
  } catch {
    return null;
  }
}

const PurchaseConfirmation = () => {
  const location = useLocation();
  const confirmation = useMemo(
    () => (location.state as PurchaseConfirmationState | null) ?? readStoredConfirmation(),
    [location.state],
  );

  const isPendiente = confirmation?.pendiente === true;

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
          {isPendiente ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-amber-400 text-amber-400 sm:h-18 sm:w-18">
              <Clock className="h-8 w-8 stroke-[3]" />
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-primary text-primary sm:h-18 sm:w-18">
              <Check className="h-8 w-8 stroke-[4]" />
            </div>
          )}

          {confirmation ? (
            isPendiente ? (
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
            ) : (
              <>
                <h1 className="mt-5 font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
                  Compra confirmada
                </h1>
                <p className="mx-auto mt-3 max-w-4xl text-base leading-relaxed text-foreground/70 sm:text-lg">
                  Tus boletos fueron asignados a nombre de {confirmation.nombre} y enviados al correo electrónico
                  registrado. ¡Mucha suerte en el sorteo!
                </p>
                <p className="mx-auto mt-3 max-w-4xl text-sm leading-relaxed text-foreground/55 sm:text-base">
                  Conserva el correo de confirmación. Allí encontrarás tus boletos y el CODIGO ÚNICO para verificar y reclamar premios.
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
