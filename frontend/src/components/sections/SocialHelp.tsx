import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

type GalleryItem =
  | { type: "video"; src: string; className: string }
  | { type: "image"; src: string; alt: string; className: string };

const socialGallery: GalleryItem[] = [
  {
    type: "video",
    src: "/images/social/social.MOV",
    className: "h-[480px] sm:h-[580px]",
  },
  {
    type: "image",
    src: "/images/social/social1.jpeg",
    alt: "Jornada solidaria de Grupo Barros",
    className: "h-[520px] sm:h-[620px]",
  },
  {
    type: "image",
    src: "/images/social/social2.jpeg",
    alt: "Entrega de ayuda social",
    className: "h-[420px] sm:h-[520px]",
  },
  {
    type: "image",
    src: "/images/social/social3.jpeg",
    alt: "Acompanamiento comunitario",
    className: "h-[560px] sm:h-[660px]",
  },
  {
    type: "image",
    src: "/images/social/social4.jpeg",
    alt: "Ayuda social Grupo Barros",
    className: "h-[440px] sm:h-[540px]",
  },
  {
    type: "image",
    src: "/images/social/social5.jpeg",
    alt: "Presencia comunitaria",
    className: "h-[500px] sm:h-[600px]",
  },
  {
    type: "image",
    src: "/images/social/social6.jpeg",
    alt: "Apoyo directo a la comunidad",
    className: "h-[460px] sm:h-[560px]",
  },
  {
    type: "image",
    src: "/images/social/social9.jpeg",
    alt: "Iniciativa solidaria",
    className: "h-[520px] sm:h-[620px]",
  },
  {
    type: "image",
    src: "/images/social/social7.jpeg",
    alt: "Acompanamiento social",
    className: "h-[460px] sm:h-[560px]",
  },
  {
    type: "image",
    src: "/images/social/social8.jpeg",
    alt: "Solidaridad comunitaria",
    className: "h-[500px] sm:h-[600px]",
  },
  {
    type: "image",
    src: "/images/social/social10.jpeg",
    alt: "Grupo Barros en la comunidad",
    className: "h-[440px] sm:h-[540px]",
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
          {socialGallery.map((item, index) => (
            <motion.figure
              key={item.src}
              {...reveal}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className="mb-5 break-inside-avoid overflow-hidden rounded-[2rem] border border-primary/15 bg-card/60 shadow-[0_0_0_1px_rgba(255,215,0,0.03),0_30px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl"
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  disablePictureInPicture
                  className={`${item.className} w-full rounded-[2rem] object-cover`}
                />
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className={`${item.className} w-full rounded-[2rem] object-cover`}
                />
              )}
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};
