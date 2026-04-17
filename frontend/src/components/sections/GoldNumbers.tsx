import { motion } from "framer-motion";
import { Crown, Gift } from "lucide-react";

const goldNumbers = [
  { number: "0777", prize: "$1.000 en efectivo al instante", taken: false },
  { number: "1234", prize: "Smart TV 65\" 4K Premium", taken: false },
  { number: "8888", prize: "MacBook Air M3", taken: false },
];

export const GoldNumbers = () => {
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
            3 <span className="text-gold-gradient">Números Dorados</span>
          </h2>
          <p className="mt-4 text-foreground/70">
            Si compras uno de estos números, ganas un <span className="text-primary font-semibold">premio extra</span> al instante.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goldNumbers.map((item, i) => (
            <motion.div
              key={item.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-3xl p-[1.5px] bg-gold-gradient hover:scale-[1.02] transition-transform duration-500 shadow-gold"
            >
              <div className="relative rounded-3xl bg-card p-8 h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial-gold opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

                <div className="relative text-center">
                  <Crown className="w-8 h-8 text-primary mb-4 mx-auto" />
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Número</p>
                  <p className="font-display text-6xl sm:text-7xl font-extrabold text-gold-gradient leading-none mb-6">
                    {item.number}
                  </p>
                  <div className="pt-5 border-t border-primary/20">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary mb-2 flex items-center justify-center gap-1.5">
                      <Gift className="w-3 h-3" /> Premio Extra
                    </p>
                    <p className="text-foreground font-medium leading-snug">{item.prize}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
