import { Logo } from "../Logo";
import { Instagram, Facebook, MessageCircle, Mail, Shield, FileText } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border pt-20 pb-32 sm:pb-12 text-center">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Logo className="justify-center" />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Plataforma exclusiva de rifas premium. Sorteos transparentes, ganadores reales y experiencias de lujo accesibles para todos.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              {[
                { icon: MessageCircle, label: "WhatsApp" },
                { icon: Instagram, label: "Instagram" },
                { icon: Facebook, label: "Facebook" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary hover:shadow-gold transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold-gradient">Enlaces</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#premios" className="hover:text-primary transition-colors">Premios</a></li>
              <li><a href="#packs" className="hover:text-primary transition-colors">Packs</a></li>
              <li><a href="#ganadores" className="hover:text-primary transition-colors">Ganadores</a></li>
              <li><a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Grupo Barros. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Pagos protegidos · SSL 256-bit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
