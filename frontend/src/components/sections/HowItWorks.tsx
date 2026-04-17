import { motion } from "framer-motion";
import { ShoppingCart, MailCheck, Trophy, Gift } from "lucide-react";

const steps = [
  { icon: ShoppingCart, title: "Compra tus números", desc: "Elige tu pack y paga de forma 100% segura en segundos." },
  { icon: MailCheck, title: "Confirmación inmediata", desc: "Recibe tus números al instante por correo y WhatsApp." },
  { icon: Trophy, title: "Participa en el sorteo", desc: "Sorteos transmitidos en vivo y verificados por Lotería Nacional." },
  { icon: Gift, title: "Gana premios increíbles", desc: "Camionetas, motos, dinero en efectivo y mucho más." },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="relative py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4">Proceso</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            ¿Cómo <span className="text-gold-gradient">funciona</span>?
          </h2>
          <p className="mt-4 text-foreground/70">Cuatro pasos simples para cambiar tu vida hoy.</p>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* connecting line */}
          <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative group text-center"
            >
              <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-background border border-primary/30 flex items-center justify-center mb-5 group-hover:shadow-gold transition-all duration-500">
                <div className="absolute inset-0 rounded-full bg-gradient-radial-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                <s.icon className="w-9 h-9 text-primary relative z-10" strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold-gradient text-primary-foreground text-xs font-bold flex items-center justify-center shadow-gold">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
