import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-6 animate-float" />

          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl font-bold leading-[0.95] tracking-tight">
            <span className="text-foreground/90">NO TE</span> <br />
            <span className="text-gold-gradient">QUEDES FUERA</span>
          </h2>

          <p className="mt-6 text-lg sm:text-xl text-foreground/75 max-w-xl mx-auto">
            Tu oportunidad de ganar empieza hoy. Mañana podría ser tarde.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs tracking-[0.3em] uppercase text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Pago seguro. Confirmación instantánea.
          </div>

          <div className="mt-6 flex justify-center">
            <motion.a
              href="#packs"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gold-gradient text-primary-foreground font-bold tracking-wider text-lg shadow-gold-strong hover:scale-105 active:scale-95 transition-all glow-pulse"
            >
              COMPRAR AHORA
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
