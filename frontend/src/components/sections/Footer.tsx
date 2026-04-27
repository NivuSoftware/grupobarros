import { Logo } from "../Logo";
import { Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/grupobarros1?igsh=dGF0enRldGlwcnkx&utm_source=qr",
    external: true,
  },
  {
    icon: Mail,
    label: "Correo",
    href: "mailto:grupobarros2026@outlook.com",
    external: false,
  },
];

export const Footer = () => {
  return (
    <footer className="relative mt-24 border-t border-primary/15 bg-gradient-to-b from-background via-background to-black pt-20 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="container">
        <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_0.8fr] md:items-start md:text-left">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card/60 px-6 py-8 shadow-[0_0_0_1px_rgba(255,215,0,0.02),0_30px_80px_rgba(0,0,0,0.35)] sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,204,0,0.08),transparent_45%)]" />
            <div className="relative">
              <Logo className="justify-center md:justify-start" />
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:mx-0">
                Plataforma exclusiva de actividades premium. Actividades transparentes, ganadores reales y experiencias de lujo
                accesibles para todos.
              </p>

              <div className="mt-6 flex justify-center gap-3 md:justify-start">
                {socialLinks.map(({ icon: Icon, label, href, external }) => (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-secondary/70 text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>

              
            </div>
          </div>

          <div className="flex flex-col items-center rounded-[2rem] border border-primary/10 bg-card/40 px-6 py-8 md:items-start">
            <h4 className="font-display text-lg font-semibold text-gold-gradient">Enlaces</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li><a href="/#premios" className="transition-colors hover:text-primary">Premios</a></li>
              <li><a href="/#packs" className="transition-colors hover:text-primary">Packs</a></li>
              {/* Enlace a ganadores oculto temporalmente */}
              {/* <li><a href="/#ganadores" className="transition-colors hover:text-primary">Ganadores</a></li> */}
              <li><a href="/#como-funciona" className="transition-colors hover:text-primary">Cómo funciona</a></li>
              <li><Link to="/como-comprar" className="transition-colors hover:text-primary">¿Cómo comprar?</Link></li>
              <li><Link to="/terminos-y-condiciones" className="transition-colors hover:text-primary">Términos y Condiciones</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/15 py-8 text-xs text-muted-foreground">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <p>© {new Date().getFullYear()} Grupo Barros. Todos los derechos reservados.</p>
            <div className="hidden h-3 w-px bg-primary/20 sm:block" />
            <span>Actividades premium con experiencia segura y transparente.</span>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/15 bg-gradient-to-b from-black to-background px-4 py-5">
        <a
          href="https://www.nivusoftware.com"
          target="_blank"
          rel="noreferrer"
          className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-center text-sm font-medium text-white/65 transition-colors hover:text-white/80 sm:text-base"
        >
          <img
            src="/images/logo_nube.png"
            alt="Nube Nivusoftware"
            className="h-4 w-4 object-contain opacity-80 sm:h-5 sm:w-5"
          />
          <span className="text-white/55">Desarrollado por</span>
          <span className="font-bold tracking-tight text-white/75">Nivusoftware</span>
        </a>
      </div>
    </footer>
  );
};
