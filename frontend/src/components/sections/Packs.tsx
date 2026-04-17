import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

const packs = [
  { id: "5", numbers: 5, price: 14, original: 15, perks: ["Confirmación inmediata", "Soporte WhatsApp"], icon: Zap },
  { id: "10", numbers: 10, price: 27, original: 30, popular: true, perks: ["Confirmación inmediata", "1 número EXTRA gratis", "Soporte prioritario", "Acceso a sorteo flash"], icon: Crown },
  { id: "20", numbers: 20, price: 50, original: 60, perks: ["Confirmación inmediata", "3 números EXTRA gratis", "Soporte VIP 24/7", "Doble chance en flash"], icon: Sparkles },
];

export const Packs = () => {
  const [selected, setSelected] = useState("10");

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
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4">Tu decides tus posibilidades</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Adquiere tus<span className="text-gold-gradient"> números</span>
          </h2>
          <p className="mt-4 text-foreground/70">Mientras más números, más oportunidades de ganar.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packs.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <motion.button
                key={p.id}
                onClick={() => setSelected(p.id)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`relative text-center rounded-3xl p-7 transition-all duration-500 group ${
                  isSelected
                    ? "bg-gradient-to-br from-primary/20 via-card to-card border-2 border-primary shadow-gold-strong scale-[1.02]"
                    : "bg-card border border-border hover:border-primary/60 hover:-translate-y-1"
                } ${p.popular ? "md:-mt-4" : ""}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold-gradient text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase shadow-gold">
                    ★ Más Popular
                  </span>
                )}

                <div className="mb-4 flex justify-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? "bg-gold-gradient" : "bg-secondary"}`}>
                    <p.icon className={`w-6 h-6 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  {isSelected && (
                    <div className="absolute top-6 right-6 w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center animate-scale-in">
                      <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <h3 className="font-display text-2xl font-bold mb-1">{p.numbers} Números</h3>
                <div className="flex items-baseline justify-center gap-2 mb-5">
                  <span className="font-display text-5xl font-bold text-gold-gradient">${p.price}</span>
                  <span className="text-muted-foreground line-through">${p.original}</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center justify-center gap-2 text-center text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className={`w-full text-center px-4 py-3 rounded-full font-semibold tracking-wide text-sm transition-all ${
                  isSelected ? "bg-gold-gradient text-primary-foreground shadow-gold" : "bg-secondary text-foreground border border-border"
                }`}>
                  {isSelected ? "✓ Seleccionado" : "Seleccionar Pack"}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gold-gradient text-primary-foreground font-bold tracking-wider shadow-gold-strong hover:scale-105 active:scale-95 transition-all text-lg glow-pulse"
          >
            CONFIRMAR COMPRA →
          </a>
          <p className="mt-3 text-xs tracking-wide text-muted-foreground">Pago 100% seguro · Confirmación instantánea</p>
        </motion.div>
      </div>
    </section>
  );
};
