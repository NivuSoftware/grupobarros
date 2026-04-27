import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import type { SorteoActivoData } from "@/lib/useSorteoActivo";
import type { NumeroEspecial } from "@/lib/api";
import { getNumeroEspecialColorTheme } from "@/lib/numeroEspecialTheme";

interface Props {
  sorteoData: SorteoActivoData | null;
  loading: boolean;
}

export const OrangeNumber = ({ sorteoData, loading }: Props) => {
  const orangeNe: NumeroEspecial[] = sorteoData
    ? sorteoData.ne.filter((n) => n.tipo === "NARANJA" && n.numero >= 0)
    : [];
  const primaryTheme = getNumeroEspecialColorTheme(orangeNe[0]?.color);

  if (!loading && orangeNe.length === 0) return null;

  return (
    <section id="numero-naranja" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: primaryTheme.accentGlow }}
        />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-[0.25em] uppercase mb-5 shadow-lg"
            style={{
              background: primaryTheme.chipBackground ?? `linear-gradient(135deg, ${primaryTheme.accentStrong} 0%, ${primaryTheme.accent} 100%)`,
              boxShadow: `0 0 40px ${primaryTheme.accentGlow}`,
            }}
          >
            <Flame className="w-4 h-4" />
            {orangeNe.length > 1 ? primaryTheme.badgePlural : primaryTheme.badgeSingular}
          </div>

          {loading ? (
            <div className="h-12 w-72 mx-auto rounded-lg bg-secondary/50 animate-pulse" />
          ) : (
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              {orangeNe.length > 1 ? (
                <>Los <span style={{ color: primaryTheme.accent }}>{primaryTheme.badgePlural}</span> ganan{" "}
                  <span className="text-gold-gradient">premios especiales</span></>
              ) : orangeNe[0]?.nombre_premio ? (
                <>El <span style={{ color: primaryTheme.accent }}>{primaryTheme.badgeSingular}</span> gana{" "}
                  <span className="text-gold-gradient">{orangeNe[0].nombre_premio}</span></>
              ) : (
                <>El <span style={{ color: primaryTheme.accent }}>{primaryTheme.badgeSingular}</span> se lleva un{" "}
                  <span className="text-gold-gradient">premio especial</span></>
              )}
            </h2>
          )}
          <p className="mt-4 text-foreground/70">
            {orangeNe.length > 1
              ? `Estos ${primaryTheme.badgePlural.toLowerCase()} ganan premios especiales al instante.`
              : `Un único ${primaryTheme.badgeSingular.toLowerCase()} gana un premio especial al instante.`}
          </p>
        </motion.div>

        {loading ? (
          <div className="max-w-4xl mx-auto h-72 rounded-3xl bg-secondary/40 animate-pulse" />
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {orangeNe.map((item, i) => {
              const ganado = item.es_ganador;
              const itemTheme = getNumeroEspecialColorTheme(item.color);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative rounded-3xl overflow-hidden border-2 shadow-luxury transition-all ${
                    ganado ? "opacity-60 grayscale border-zinc-600/30" : ""
                  }`}
                  style={ganado ? {} : { borderColor: itemTheme.accentSoft }}
                >
                  <div className="grid md:grid-cols-2 bg-card">
                    {/* Image (if available) */}
                    {item.imagen ? (
                      <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
                        <img
                          src={item.imagen}
                          alt={item.nombre_premio ?? `Número ${item.numero}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div
                          className="absolute inset-0 mix-blend-overlay opacity-40"
                          style={{ background: itemTheme.imageOverlay }}
                        />
                        {ganado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-card/70">
                            <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 bg-card/90 px-4 py-2 rounded-full border border-zinc-600/40">
                              Ganador declarado
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Sin imagen: bloque de número grande */
                      <div
                        className="relative aspect-[4/3] md:aspect-auto overflow-hidden flex items-center justify-center"
                        style={{ background: ganado ? "hsl(0 0% 10%)" : itemTheme.cardBackground }}
                      >
                        <p className={`font-display text-8xl font-extrabold leading-none select-none ${
                          ganado ? "line-through text-zinc-600" : ""
                        }`} style={ganado ? {} : { color: itemTheme.numberColor ?? itemTheme.accent, textShadow: itemTheme.numberGlow }}>
                          {String(item.numero).padStart(4, "0")}
                        </p>
                        {ganado && (
                          <div className="absolute inset-0 flex items-end justify-center pb-6">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 bg-card/80 px-3 py-1 rounded-full border border-zinc-600/40">
                              Ya tiene ganador
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center relative">
                      {!ganado && (
                        <div
                          className="absolute top-6 right-6 w-20 h-20 rounded-full blur-2xl"
                          style={{ background: itemTheme.accentGlow }}
                        />
                      )}
                      <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: itemTheme.numberColor ?? itemTheme.accent }}>
                        {itemTheme.badgeSingular}
                      </p>

                      {/* Número (siempre visible) */}
                      <p className={`font-display text-5xl font-extrabold mb-3 ${
                        ganado ? "line-through text-zinc-500" : ""
                      }`} style={ganado ? {} : { color: itemTheme.numberColor ?? itemTheme.accent, textShadow: itemTheme.numberGlow }}>
                        {String(item.numero).padStart(4, "0")}
                      </p>

                      {item.nombre_premio ? (
                        <h3 className={`font-display text-3xl sm:text-4xl font-extrabold mb-4 leading-tight ${ganado ? "text-zinc-500 line-through" : ""}`}>
                          <span className={ganado ? "text-zinc-500" : "text-gold-gradient"}>
                            {item.nombre_premio}
                          </span>
                        </h3>
                      ) : (
                        <h3 className={`font-display text-3xl sm:text-4xl font-extrabold mb-4 leading-tight ${ganado ? "text-zinc-500" : ""}`}>
                          Premio especial
                        </h3>
                      )}

                      {ganado ? (
                        <p className="text-sm text-zinc-500 italic">Este número ya tiene ganador declarado.</p>
                      ) : (
                        <div
                          className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/60 border mt-2"
                          style={{ borderColor: itemTheme.accentSoft }}
                        >
                          <Zap className="w-5 h-5 flex-shrink-0" style={{ color: itemTheme.accent }} />
                          <p className="text-sm text-foreground/80">
                            ¿Te salió el número? <span className="font-semibold text-foreground">Envíanos un mensaje</span> y reclama tu premio.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
