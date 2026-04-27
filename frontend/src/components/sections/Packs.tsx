import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSorteoActivo } from "@/lib/useSorteoActivo";
import {
  getDefaultTicketQuantity,
  getMinimumSelectableTickets,
  getNormalizedCheckoutQuantity,
  getTicketQuantityError,
  isTicketQuantityAllowed,
  normalizeTicketQuantityInput,
} from "@/lib/ticketQuantity";

const TICKET_PRICE = 2;

const packs = [3, 8, 10, 20, 30, 50].map((numbers) => ({
  id: String(numbers),
  numbers,
  price: numbers * TICKET_PRICE,
}));

const formatMoney = (value: number) => `$${value.toLocaleString("es-EC")}`;

const checkoutUrl = (numbers: number) => `/checkout?cantidad=${numbers}`;

export const Packs = () => {
  const { data } = useSorteoActivo();
  const availableTickets = data?.stats.disponibles;
  const [customQuantity, setCustomQuantity] = useState(String(getDefaultTicketQuantity()));
  const parsedCustomQuantity = Number(customQuantity);
  const safeCustomQuantity = Number.isFinite(parsedCustomQuantity)
    ? normalizeTicketQuantityInput(parsedCustomQuantity)
    : getDefaultTicketQuantity(availableTickets);
  const customQuantityAllowed =
    typeof availableTickets === "number" ? isTicketQuantityAllowed(safeCustomQuantity, availableTickets) : true;
  const customQuantityError =
    typeof availableTickets === "number" ? getTicketQuantityError(safeCustomQuantity, availableTickets) : null;
  const customPrice = safeCustomQuantity * TICKET_PRICE;

  useEffect(() => {
    if (typeof availableTickets !== "number") return;

    setCustomQuantity((current) => {
      const currentValue = Number(current);
      const normalizedCurrent = Number.isFinite(currentValue)
        ? normalizeTicketQuantityInput(currentValue)
        : getDefaultTicketQuantity(availableTickets);

      if (isTicketQuantityAllowed(normalizedCurrent, availableTickets)) {
        return String(normalizedCurrent);
      }

      return String(getDefaultTicketQuantity(availableTickets));
    });
  }, [availableTickets]);

  return (
    <section id="packs" className="relative py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4">Prueba tu suerte</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Adquiere tus<span className="text-gold-gradient"> números</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {packs.map((pack, i) => {
            const packAllowed = typeof availableTickets === "number"
              ? isTicketQuantityAllowed(pack.numbers, availableTickets)
              : true;

            return (
              <motion.article
                key={pack.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={`relative rounded-lg border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 ${
                  pack.numbers === 10 ? "pt-8" : ""
                }`}
              >
                {pack.numbers === 10 && (
                  <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-gold-gradient px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-gold">
                    Más vendido
                  </span>
                )}
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Cantidad</p>
                <h3 className="mt-2 font-display text-4xl font-bold">x{pack.numbers} boletos</h3>
                <p className="mt-3 font-display text-5xl font-bold text-gold-gradient">{formatMoney(pack.price)}</p>
                <Link
                  to={packAllowed ? checkoutUrl(pack.numbers) : "#packs"}
                  onClick={(event) => {
                    if (!packAllowed) event.preventDefault();
                  }}
                  aria-disabled={!packAllowed}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gold-gradient px-5 py-3 font-bold text-primary-foreground shadow-gold transition-transform ${
                    packAllowed ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  Comprar
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-3xl rounded-lg border border-primary/30 bg-card p-6"
        >
          <label htmlFor="customTickets" className="block text-center font-display text-2xl font-bold">
            ¿Quieres más números?
          </label>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Agrega la cantidad que desees.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              id="customTickets"
              type="number"
              min={getMinimumSelectableTickets(availableTickets)}
              step={1}
              value={customQuantity}
              onChange={(event) => setCustomQuantity(event.target.value)}
              onBlur={() => setCustomQuantity(String(getNormalizedCheckoutQuantity(parsedCustomQuantity, availableTickets)))}
              className="h-12 rounded-lg border border-primary/30 bg-background px-4 text-center text-lg font-bold text-foreground outline-none focus:border-primary"
            />
            <div className="flex h-12 items-center justify-center rounded-lg border border-border bg-secondary px-6 font-display text-2xl font-bold text-gold-gradient">
              {formatMoney(customPrice)}
            </div>
            <Link
              to={customQuantityAllowed ? checkoutUrl(safeCustomQuantity) : "#packs"}
              onClick={(event) => {
                if (!customQuantityAllowed) event.preventDefault();
              }}
              aria-disabled={!customQuantityAllowed}
              className={`inline-flex h-12 items-center justify-center rounded-lg bg-gold-gradient px-8 font-bold text-primary-foreground shadow-gold transition-transform ${
                customQuantityAllowed ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed opacity-50"
              }`}
            >
              Comprar
            </Link>
          </div>
          {customQuantityError && (
            <p className="mt-3 text-center text-sm text-destructive">{customQuantityError}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-center"
        >
          <Link
            to="/como-comprar"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
          >
            ¿Cómo comprar? Ver tutorial →
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
