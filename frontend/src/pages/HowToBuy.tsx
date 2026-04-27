import { Link } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useSorteoActivo } from "@/lib/useSorteoActivo";
import transferVideo from "@/assets/transfer.mp4";
import tarjetaVideo from "@/assets/tarjeta.mp4";

const HowToBuy = () => {
  const { data, loading } = useSorteoActivo();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar sorteoData={data} loading={loading} />

      <section className="relative overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />

        <div className="container relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <PlayCircle className="h-4 w-4" />
              Tutorial
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              ¿Cómo comprar{" "}
              <span className="text-gold-gradient">tus boletos?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Sigue el tutorial si quieres comprar con transferencia o con
              tarjeta de crédito, ¡es súper fácil y rápido!
            </p>
          </motion.div>

          {/* Videos — 2 columnas en PC, apilados en móvil */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2">
            {[
              { num: 1, title: "Comprar con transferencia bancaria", src: transferVideo },
              { num: 2, title: "Comprar con tarjeta de crédito",     src: tarjetaVideo  },
            ].map(({ num, title, src }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-gradient font-display text-base font-bold text-primary-foreground">
                    {num}
                  </div>
                  <h2 className="font-display text-lg font-extrabold text-gold-gradient sm:text-xl">
                    {title}
                  </h2>
                </div>

                {/* Contenedor 9:16 centrado */}
                <div className="mx-auto w-full max-w-[320px] sm:max-w-full">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-card/75 shadow-luxury backdrop-blur" style={{ aspectRatio: "9/16" }}>
                    <video
                      controls
                      className="absolute inset-0 h-full w-full object-cover"
                      preload="metadata"
                    >
                      <source src={src} type="video/mp4" />
                      Tu navegador no soporta el video.
                    </video>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Back link */}
          <div className="mt-16 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-7 py-4 font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 text-primary" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default HowToBuy;
