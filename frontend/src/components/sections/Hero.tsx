import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import heroBg from "/images/hero.png";
import { ProgressBar } from "../ProgressBar";
import type { SorteoActivoData } from "@/lib/useSorteoActivo";

interface Props {
  sorteoData: SorteoActivoData | null;
  loading: boolean;
}

export const Hero = ({ sorteoData, loading }: Props) => {
  const [active, setActive] = useState(0);

  const imagenes: string[] = sorteoData?.sorteo.premio_mayor_imagenes?.length
    ? sorteoData.sorteo.premio_mayor_imagenes
    : [];

  const stats = sorteoData?.stats;
  const sorteo = sorteoData?.sorteo;
  const noSorteo = !loading && !sorteo;
  const canNavigateImages = imagenes.length > 1;

  useEffect(() => {
    if (imagenes.length > 0 && active >= imagenes.length) setActive(0);
  }, [active, imagenes.length]);

  const goToImage = (direction: -1 | 1) => {
    if (!canNavigateImages) return;
    setActive((current) => (current + direction + imagenes.length) % imagenes.length);
  };

  const progressPanel = (
    <>
      <div className="mx-auto p-6 sm:p-7 rounded-2xl bg-card/70 backdrop-blur-xl border border-border gold-border">
        {loading || !stats ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 w-1/2 rounded bg-secondary/50 mx-auto" />
            <div className="h-4 w-full rounded bg-secondary/50" />
          </div>
        ) : (
          <>
            <ProgressBar
              value={stats.porcentajeVendido}
              label="¡BOLETOS LIMITADOS!"
              barClassName="h-5"
              labelClassName="mb-4 text-base sm:text-lg"
            />
            <div className="mt-5 text-sm sm:text-base leading-relaxed text-foreground/70">
              Los premios se jugarán una vez vendida la totalidad de los números, es decir, cuando la barra de progreso llegue al 100%. Se hará tomando los 5 números de la primera de la nacional.
            </div>
          </>
        )}
      </div>

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
    </>
  );

  return (
    <section
      className={`relative w-full overflow-hidden pb-16 text-center ${
        noSorteo ? "pt-36 sm:pt-40 lg:pt-44" : "pt-40 sm:pt-44 lg:pt-44 xl:pt-48"
      }`}
    >
      <img src={heroBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-background/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-25 pointer-events-none" />

      <div className="container relative z-10">

        {/* ── SIN SORTEO ACTIVO ─────────────────────────────────────── */}
        {noSorteo ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl py-8 sm:py-10 lg:py-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-primary/30 text-xs font-bold tracking-[0.25em] uppercase mb-8 text-foreground/70">
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              Próximamente
            </span>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              El próximo<br />
              <span className="text-gold-gradient">gran premio</span><br />
              está en camino.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-lg mx-auto">
              Nuestro siguiente sorteo está a punto de abrir.{" "}
              <span className="text-primary font-semibold">Prepárate</span> — los mejores premios
              se agotan en minutos.
            </p>

            <div className="mt-4 text-base text-foreground/50">
              Mientras tanto, revisa cómo funcionamos mientras anunciamos nuestro próximo sorteo.
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              {/* CTA de ganadores oculta temporalmente */}
              {/* <a
                href="#ganadores"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary transition-all backdrop-blur-md font-medium"
              >
                <Bell className="w-4 h-4 text-primary" />
                Ver ganadores anteriores
              </a> */}
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-secondary/60 border border-border text-foreground/70 hover:text-foreground transition-colors font-medium"
              >
                Cómo funciona
              </a>
            </div>
          </motion.div>
        ) : (
          /* ── CON SORTEO ACTIVO ───────────────────────────────────── */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold tracking-[0.25em] uppercase shadow-gold">
                <Flame className="w-4 h-4" />
                {sorteo ? sorteo.nombre : "Sorteo activo"}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-primary/30 text-xs text-foreground/80">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive glow-pulse" />
                Sorteo activo
              </span>
            </motion.div>

            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-4 items-start">
              {/* LEFT: Gallery */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="order-2 lg:order-1 lg:row-span-2 w-full max-w-xl mx-auto"
              >
                {loading ? (
                  <div className="rounded-3xl bg-secondary/40 animate-pulse h-[420px] sm:h-[520px]" />
                ) : imagenes.length > 0 ? (
                  <>
                    <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-card shadow-luxury group">
                      <motion.img
                        key={active}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        src={imagenes[active]}
                        alt={sorteo?.premio_mayor_nombre ?? "Premio mayor"}
                        className="w-full h-[420px] sm:h-[520px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
                      {canNavigateImages && (
                        <>
                          <button
                            type="button"
                            onClick={() => goToImage(-1)}
                            aria-label="Imagen anterior"
                            className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-foreground backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => goToImage(1)}
                            aria-label="Imagen siguiente"
                            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-foreground backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}
                    </div>
                    {imagenes.length > 1 && (
                      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                        {imagenes.map((img, i) => (
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
                    )}
                  </>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-card shadow-luxury h-[420px] sm:h-[520px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-radial-gold opacity-40" />
                    <Sparkles className="relative w-20 h-20 text-primary opacity-40" />
                  </div>
                )}
              </motion.div>

              {/* RIGHT: Info */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="order-1 lg:order-2 w-full max-w-xl mx-auto"
              >
                <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3">Premio principal</p>

                {loading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-3/4 rounded-lg bg-secondary/50 animate-pulse" />
                    <div className="h-10 w-1/2 rounded-lg bg-secondary/50 animate-pulse" />
                  </div>
                ) : (
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                    <span className="text-gold-gradient">
                      {sorteo?.premio_mayor_nombre ?? "Premio Mayor"}
                    </span>
                  </h1>
                )}

                {sorteo?.premio_mayor_descripcion && (
                  <p className="mt-4 text-base sm:text-lg text-foreground/75 leading-relaxed">
                    {sorteo.premio_mayor_descripcion}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="order-3 lg:order-3 w-full max-w-xl mx-auto"
              >
                {progressPanel}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
