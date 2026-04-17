import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import iphone from "@/assets/iphone-prize.jpg";

export const OrangeNumber = () => {
  return (
    <section id="numero-naranja" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Orange glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[120px]" />
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
              background: "linear-gradient(135deg, hsl(20 95% 55%) 0%, hsl(35 95% 60%) 100%)",
              boxShadow: "0 0 40px hsl(25 95% 55% / 0.5)",
            }}
          >
            <Flame className="w-4 h-4" />
            Número Naranja
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
            El <span style={{ color: "hsl(25 95% 60%)" }}>Naranja</span> se lleva un{" "}
            <span className="text-gold-gradient">iPhone</span>
          </h2>
          <p className="mt-4 text-foreground/70">
            Un único número marcado en naranja gana un premio especial al instante.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border-2 shadow-luxury"
          style={{ borderColor: "hsl(25 95% 55% / 0.4)" }}
        >
          <div className="grid md:grid-cols-2 bg-card">
            {/* Image */}
            <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
              <img
                src={iphone}
                alt="iPhone 15 Pro Max premio"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1200}
                height={800}
              />
              <div
                className="absolute inset-0 mix-blend-overlay opacity-40"
                style={{ background: "linear-gradient(135deg, hsl(25 95% 55%), transparent)" }}
              />
            </div>

            {/* Content */}
            <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center relative">
              <div
                className="absolute top-6 right-6 w-20 h-20 rounded-full blur-2xl"
                style={{ background: "hsl(25 95% 55% / 0.4)" }}
              />
              <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(25 95% 60%)" }}>
                Premio Naranja
              </p>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                iPhone 15 <br />
                <span className="text-gold-gradient">Pro Max 256GB</span>
              </h3>
              <p className="text-foreground/70 mb-6 leading-relaxed">
                Si tu número resulta ser el <span className="font-semibold" style={{ color: "hsl(25 95% 60%)" }}>naranja</span>, te llevas el iPhone 15 Pro Max sellado, original, con garantía oficial.
              </p>

              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/60 border" style={{ borderColor: "hsl(25 95% 55% / 0.3)" }}>
                <Zap className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(25 95% 60%)" }} />
                <p className="text-sm text-foreground/80">
                  Entrega <span className="font-semibold text-foreground">inmediata</span> al ganador
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
