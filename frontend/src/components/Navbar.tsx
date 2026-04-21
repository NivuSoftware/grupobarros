import { Logo } from "./Logo";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { SorteoActivoData } from "@/lib/useSorteoActivo";

interface NavbarProps {
  sorteoData: SorteoActivoData | null;
  loading: boolean;
}

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

export const Navbar = ({ sorteoData, loading }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stats = sorteoData?.stats;
  const showProgress = !loading && sorteoData?.sorteo.estado === "ACTIVO" && !!stats;
  const progress = stats ? clampProgress(stats.porcentajeVendido) : 0;
  const progressLabel = progress.toLocaleString("es-EC", { maximumFractionDigits: 2 });

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border/60" : "bg-background/40 backdrop-blur-md"
      }`}
    >
      {/* Main bar */}
      <div className={`container flex items-center justify-center md:justify-between transition-all ${scrolled ? "py-4" : "py-5"}`}>
        <Logo />
        <nav className="hidden md:flex items-center gap-10 text-base tracking-wide text-foreground/70">
          <a href="#numeros-oro" className="hover:text-primary transition-colors">Números de Oro</a>
          <a href="#packs" className="hover:text-primary transition-colors">Packs</a>
          <a href="#ganadores" className="hover:text-primary transition-colors">Ganadores</a>
          <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo Funciona</a>
        </nav>
        <a
          href="#packs"
          className="hidden md:inline-flex items-center px-7 py-3 rounded-full bg-gold-gradient text-primary-foreground text-base font-semibold tracking-wide hover:scale-105 transition-transform shadow-gold"
        >
          Comprar Ahora
        </a>
      </div>

      {/* Sub navbar — active draw progress */}
      {showProgress && stats && (
        <div className="border-t border-primary/20 bg-card/40 backdrop-blur-xl">
          <div className="container flex items-center gap-4 sm:gap-6 py-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-destructive" />
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-destructive font-bold whitespace-nowrap">
                Avance del sorteo
              </span>
            </div>
            <div className="flex-1 h-3.5 rounded-full bg-secondary overflow-hidden relative">
              <div
                className="h-full bg-gold-gradient relative transition-all duration-700"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
            <span className="text-sm sm:text-base font-bold text-gold-gradient whitespace-nowrap">{progressLabel}%</span>
          </div>
        </div>
      )}
    </header>
  );
};
