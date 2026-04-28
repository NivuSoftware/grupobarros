import { motion } from "framer-motion";

const winners = [
  { img: "/images/winners/winner1.png" },
  { img: "/images/winners/winner2.png" },
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
          <p className="mt-4 text-foreground/70">No vendemos promesas. Entregamos resultados. #GRUPO BARROS SI CUMPLE!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {winners.map((w, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="group rounded-3xl overflow-hidden border border-border hover:border-primary/60 transition-all duration-500 hover:shadow-luxury"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={w.img}
                  alt={`Ganador ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
