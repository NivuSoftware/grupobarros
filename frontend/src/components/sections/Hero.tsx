import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Flame, Sparkles, Calendar, MapPin } from "lucide-react";
import heroBg from "@/assets/hero.jpeg";
import motoMain from "@/assets/moto-main.jpg";
import motoSide from "@/assets/moto-side.jpg";
import motoFront from "@/assets/moto-front.jpg";
import motoDetail from "@/assets/moto-detail.jpg";
import { ProgressBar } from "../ProgressBar";
import { CountUp } from "../CountUp";

const gallery = [motoMain, motoSide, motoFront, motoDetail];

export const Hero = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="relative w-full overflow-hidden pt-48 sm:pt-56 lg:pt-60 pb-16 text-center">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-background/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-25 pointer-events-none" />

      <div className="container relative z-10">
        {/* Activity badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold tracking-[0.25em] uppercase shadow-gold">
            <Flame className="w-4 h-4" />
            Actividad 1
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-primary/30 text-xs text-foreground/80">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive glow-pulse" />
            En vivo · Sorteo activo
          </span>
        </motion.div>

        <div className="mx-auto grid max-w-6xl lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 w-full max-w-xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-card shadow-luxury group">
              <motion.img
                key={active}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                src={gallery[active]}
                alt="Moto deportiva premium en sorteo"
                className="w-full h-[420px] sm:h-[520px] object-cover"
                width={1600}
                height={1200}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-primary/30 text-xs font-semibold">
                <span className="text-gold-gradient">FOTO REAL</span>
              </div>
            </div>

            {/* Thumbnails row */}
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    active === i
                      ? "border-primary shadow-gold scale-105"
                      : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="order-1 lg:order-2 w-full max-w-xl mx-auto"
          >
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3">Premio principal</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              MOTO DEPORTIVA <br />
              <span className="text-gold-gradient">YAMAHA R1 2024</span>
            </h1>

            <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-foreground/70">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> Sorteo: 30 Dic 2025
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> Entrega nacional
              </span>
            </div>

            <p className="mt-5 text-base sm:text-lg text-foreground/75 leading-relaxed">
              Participa por solo <span className="text-gold-gradient font-bold">$3</span> y llévate
              esta máquina 0 km. Miles ya están dentro.{" "}
              <span className="text-primary font-medium">¿Vas a quedarte fuera?</span>
            </p>

            {/* Progress card */}
            <div className="mt-6 mx-auto p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border gold-border">
              <div className="grid grid-cols-2 gap-4 mb-3 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vendidos</p>
                  <p className="font-display text-2xl font-bold text-gold-gradient">
                    <CountUp end={7842} suffix=" / 10.000" />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-destructive">Disponibles</p>
                  <p className="text-xl font-bold text-foreground">2.158</p>
                </div>
              </div>
              <ProgressBar value={78} label="Avance" />
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="#packs"
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold tracking-wide text-base shadow-gold-strong hover:scale-[1.03] active:scale-[0.98] transition-all glow-pulse"
              >
                <Sparkles className="w-5 h-5" />
                COMPRAR AHORA
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#numeros-oro"
                className="inline-flex items-center justify-center px-7 py-4 rounded-full border border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary transition-all backdrop-blur-md font-medium"
              >
                Ver Números de Oro
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
