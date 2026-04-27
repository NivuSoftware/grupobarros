import { motion } from "framer-motion";

const cardClass =
  "overflow-hidden rounded-[2rem] border border-primary/15 bg-card/60 shadow-[0_0_0_1px_rgba(255,215,0,0.03),0_30px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl";

const mediaClass = "h-full w-full object-cover rounded-[2rem]";

export const SocialHelp = () => {
  return (
    <section id="ayuda-social" className="relative overflow-hidden py-24 sm:py-32">
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
            También creemos en compartir oportunidades fuera de las actividades.
            Acompañamos a personas, fundaciones y causas locales con apoyo
            directo, articulación y presencia real en la comunidad.
          </p>
        </motion.div>

        {/* Grid de 3 columnas: video | social1 | social9 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Video — izquierda */}
          <motion.figure
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0 }}
            className={`${cardClass} h-[520px] sm:h-[620px]`}
          >
            <video
              src="/images/social/social.MOV"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              className={mediaClass}
            />
          </motion.figure>

          {/* social1.png — centro */}
          <motion.figure
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className={`${cardClass} h-[520px] sm:h-[620px]`}
          >
            <img
              src="/images/social/social1.png"
              alt="Ayuda social Grupo Barros"
              loading="lazy"
              className={mediaClass}
            />
          </motion.figure>

          {/* social9.jpeg — derecha */}
          <motion.figure
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className={`${cardClass} h-[520px] sm:h-[620px]`}
          >
            <img
              src="/images/social/social9.jpeg"
              alt="Iniciativa solidaria Grupo Barros"
              loading="lazy"
              className={mediaClass}
            />
          </motion.figure>
        </div>
      </div>
    </section>
  );
};
