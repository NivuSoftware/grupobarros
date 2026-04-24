import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

const socialGallery = [
  {
    src: "/images/social/social1.jpeg",
    alt: "Jornada solidaria de Grupo Barros",
    className: "h-[520px] sm:h-[620px]",
  },
  {
    src: "/images/social/social2.jpeg",
    alt: "Entrega de ayuda social",
    className: "h-[420px] sm:h-[520px]",
  },
  {
    src: "/images/social/social3.jpeg",
    alt: "Acompanamiento comunitario",
    className: "h-[560px] sm:h-[660px]",
  },
];

export const SocialHelp = () => {
  return (
    <section
      id="ayuda-social"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-radial-gold opacity-30 blur-3xl" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Donde hay comunidad,
            <span className="text-gold-gradient"> Grupo Barros suma</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-foreground/70 sm:text-lg">
            Tambien creemos en compartir oportunidades fuera del sorteo.
            Acompanamos personas, fundaciones y causas locales con apoyo
            directo, articulacion y presencia real en la comunidad.
          </p>
        </motion.div>

        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {socialGallery.map((image, index) => (
            <motion.figure
              key={image.src}
              {...reveal}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className="mb-5 break-inside-avoid overflow-hidden rounded-[2rem] border border-primary/15 bg-card/60 shadow-[0_0_0_1px_rgba(255,215,0,0.03),0_30px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className={`${image.className} w-full rounded-[2rem] object-cover`}
              />
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};
