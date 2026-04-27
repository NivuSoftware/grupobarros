import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export const StickyBuy = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sticky-buy-visible", show);
    return () => document.documentElement.classList.remove("sticky-buy-visible");
  }, [show]);

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 sm:hidden transition-all duration-500 ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="p-3 bg-background/90 backdrop-blur-xl border-t border-primary/30">
        <a
          href="#packs"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold tracking-wider shadow-gold-strong active:scale-95 transition-transform glow-pulse"
        >
          <ShoppingBag className="w-5 h-5" />
          COMPRAR AHORA DESDE $6
        </a>
      </div>
    </div>
  );
};
