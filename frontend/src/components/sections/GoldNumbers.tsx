import { motion } from "framer-motion";
import { Crown, Gift } from "lucide-react";
import type { SorteoActivoData } from "@/lib/useSorteoActivo";
import type { NumeroEspecial } from "@/lib/api";

interface Props {
  sorteoData: SorteoActivoData | null;
  loading: boolean;
}

export const GoldNumbers = ({ sorteoData, loading }: Props) => {
  const goldNe: NumeroEspecial[] = sorteoData
    ? sorteoData.ne.filter((n) => n.tipo === "ORO" && n.numero >= 0)
    : [];

  if (!loading && goldNe.length === 0) return null;

  return (
    <section id="numeros-oro" className="relative py-20 sm:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold tracking-[0.25em] uppercase mb-5 shadow-gold">
            <Crown className="w-4 h-4" />
            Números de Oro
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
            {loading ? (
              <span className="inline-block h-12 w-64 rounded-lg bg-secondary/50 animate-pulse" />
            ) : (
              <>
                {goldNe.length}{" "}
                <span className="text-gold-gradient">
                  {goldNe.length === 1 ? "Número Dorado" : "Números Dorados"}
                </span>
              </>
            )}
          </h2>
          <p className="mt-4 text-foreground/70">
             Por la compra de tus boletos ya participas por premios{" "}
            <span className="text-primary font-semibold">instantáneos</span> revisa si tu suerte te entrego alguno de estos numeros y envianos un mensaje para reclamar tu premio.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${goldNe.length === 1 ? "max-w-sm mx-auto" : goldNe.length === 2 ? "md:grid-cols-2 max-w-2xl mx-auto" : "md:grid-cols-3"}`}>
            {goldNe.map((item, i) => {
              const ganado = item.es_ganador;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={`group relative rounded-3xl p-[1.5px] transition-transform duration-500 ${
                    ganado
                      ? "bg-zinc-600/40 shadow-none opacity-60 grayscale"
                      : "bg-gold-gradient hover:scale-[1.02] shadow-gold"
                  }`}
                >
                  <div className="relative rounded-3xl bg-card h-full overflow-hidden">
                    {!ganado && (
                      <>
                        <div className="absolute inset-0 bg-gradient-radial-gold opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                      </>
                    )}

                    {/* Imagen del premio (si existe) */}
                    {item.imagen && (
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={item.imagen}
                          alt={item.nombre_premio ?? `Número ${item.numero}`}
                          className={`w-full h-full object-cover transition-all duration-500 ${ganado ? "" : "group-hover:scale-105"}`}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                        {ganado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-card/60">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 bg-card/80 px-3 py-1 rounded-full border border-zinc-600/40">
                              Ganador declarado
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`relative text-center ${item.imagen ? "p-6" : "p-8"}`}>
                      {!item.imagen && <Crown className="w-8 h-8 text-primary mb-4 mx-auto" />}
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Número</p>
                      <p className={`font-display text-6xl sm:text-7xl font-extrabold leading-none mb-4 ${
                        ganado ? "line-through text-zinc-500" : "text-gold-gradient"
                      }`}>
                        {String(item.numero).padStart(4, "0")}
                      </p>

                      {(item.nombre_premio || ganado) && (
                        <div className="pt-4 border-t border-primary/20">
                          {item.nombre_premio && (
                            <>
                              <p className="text-[10px] uppercase tracking-[0.25em] text-primary mb-2 flex items-center justify-center gap-1.5">
                                <Gift className="w-3 h-3" /> Premio Extra
                              </p>
                              <p className={`font-medium leading-snug ${ganado ? "text-zinc-500 line-through" : "text-foreground"}`}>
                                {item.nombre_premio}
                              </p>
                            </>
                          )}
                          {ganado && (
                            <p className="mt-2 text-xs text-zinc-500 italic">Ya tiene ganador</p>
                          )}
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
