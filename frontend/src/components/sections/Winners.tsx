import { motion } from "framer-motion";
import { Quote, BadgeCheck } from "lucide-react";
import w1 from "@/assets/winner-1.jpg";
import w2 from "@/assets/winner-2.jpg";
import w3 from "@/assets/winner-3.jpg";

const winners = [
  { img: w1, name: "Carlos M.", city: "Quito", prize: "Moto Yamaha R3", date: "12 Mar 2025", quote: "No lo podía creer, es 100% real. Recibí mi moto en una semana." },
  { img: w2, name: "María L.", city: "Guayaquil", prize: "$4.000 en efectivo", date: "28 Feb 2025", quote: "Compré solo 5 números y gané. Grupo Barros me cambió la vida." },
  { img: w3, name: "Diego R.", city: "Cuenca", prize: "iPhone 15 Pro Max", date: "5 Feb 2025", quote: "Llegó nuevo, sellado y con factura. Confiable al 100%." },
];

export const Winners = () => {
  return (
    <section id="ganadores" className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-secondary/30 to-background overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial-gold opacity-40 pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4">Historias Reales</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Nuestros <span className="text-gold-gradient">ganadores</span>
          </h2>
          <p className="mt-4 text-foreground/70">Personas reales. Premios reales. Historias que inspiran.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {winners.map((w, i) => (
            <motion.article
              key={w.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="group relative rounded-3xl overflow-hidden bg-card border border-border hover:border-primary/60 transition-all duration-500 hover:shadow-luxury"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={w.img}
                  alt={`${w.name} ganador de ${w.prize}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-gradient text-primary-foreground text-[10px] font-bold tracking-widest uppercase shadow-gold">
                  <BadgeCheck className="w-3 h-3" /> Ganador Real
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 text-center">
                  <h3 className="font-display text-2xl font-bold leading-tight">{w.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{w.city}, {w.date}</p>
                  <p className="text-primary font-semibold text-sm">🏆 {w.prize}</p>
                </div>
              </div>

              <div className="p-6 relative text-center">
                <Quote className="w-8 h-8 text-primary/30 mb-2 mx-auto" />
                <p className="italic text-foreground/80 leading-relaxed">"{w.quote}"</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
