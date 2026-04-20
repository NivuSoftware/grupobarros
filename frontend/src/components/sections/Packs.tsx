import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

const TICKET_PRICE = 2;
const MIN_TICKETS = 3;

const packs = [3, 8, 10, 20, 30, 50].map((numbers) => ({
  id: String(numbers),
  numbers,
  price: numbers * TICKET_PRICE,
}));

const formatMoney = (value: number) => `$${value.toLocaleString("es-EC")}`;

const checkoutUrl = (numbers: number) => `/checkout?cantidad=${numbers}`;

export const Packs = () => {
  const [customQuantity, setCustomQuantity] = useState(String(MIN_TICKETS));
  const parsedCustomQuantity = Number(customQuantity);
  const safeCustomQuantity = Number.isFinite(parsedCustomQuantity)
    ? Math.max(MIN_TICKETS, Math.trunc(parsedCustomQuantity))
    : MIN_TICKETS;
  const customPrice = safeCustomQuantity * TICKET_PRICE;

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
          {packs.map((pack, i) => (
            <motion.article
              key={pack.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="rounded-lg border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Cantidad</p>
              <h3 className="mt-2 font-display text-4xl font-bold">x{pack.numbers} boletos</h3>
              <p className="mt-3 font-display text-5xl font-bold text-gold-gradient">{formatMoney(pack.price)}</p>
              <Link
                to={checkoutUrl(pack.numbers)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gold-gradient px-5 py-3 font-bold text-primary-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Comprar
              </Link>
            </motion.article>
          ))}
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
              min={MIN_TICKETS}
              step={1}
              value={customQuantity}
              onChange={(event) => setCustomQuantity(event.target.value)}
              onBlur={() => setCustomQuantity(String(safeCustomQuantity))}
              className="h-12 rounded-lg border border-primary/30 bg-background px-4 text-center text-lg font-bold text-foreground outline-none focus:border-primary"
            />
            <div className="flex h-12 items-center justify-center rounded-lg border border-border bg-secondary px-6 font-display text-2xl font-bold text-gold-gradient">
              {formatMoney(customPrice)}
            </div>
            <Link
              to={checkoutUrl(safeCustomQuantity)}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-gold-gradient px-8 font-bold text-primary-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Comprar
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
