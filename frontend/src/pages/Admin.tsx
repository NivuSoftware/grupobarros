import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import Resumen from "@/components/admin/Resumen";
import Sorteos from "@/components/admin/Sorteos";
import Ventas from "@/components/admin/Ventas";
import Ganadores from "@/components/admin/Ganadores";

type Section = "resumen" | "sorteos" | "ventas" | "ganadores";

const navItems: { label: string; icon: React.ElementType; id: Section }[] = [
  { label: "Resumen",   icon: Home,     id: "resumen" },
  { label: "Sorteos",   icon: Trophy,   id: "sorteos" },
  { label: "Ventas",    icon: Ticket,   id: "ventas" },
  { label: "Ganadores", icon: BarChart3, id: "ganadores" },
];

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState<Section>("resumen");

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  const goTo = (id: Section) => {
    setSection(id);
    setMobileOpen(false);
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-primary/20 bg-card/95">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo className="[&_img]:h-14" />
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5">
        <div className="rounded-md border border-primary/20 bg-background/70 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.nombre || "Administrador"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.correo}</p>
            </div>
          </div>
          <Badge className="mt-3" variant="outline">
            <ShieldCheck className="h-3 w-3" />
            {user?.rol || "admin"}
          </Badge>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navItems.map(({ label, icon: Icon, id }) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors ${
              section === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-3">
        <div className="mb-3 h-px bg-primary/20" />
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-start"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Cerrando..." : "Cerrar sesion"}
        </Button>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="md:hidden">
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-primary/20 bg-card/95 px-4 py-3 backdrop-blur">
          <Logo className="[&_img]:h-12" />
          <button
            type="button"
            className="rounded-md border border-primary/25 p-2 text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            {sidebar}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:block">{sidebar}</div>

      {/* Content */}
      <section className="px-4 pb-10 pt-24 md:ml-72 md:px-8 md:pt-8">
        {section === "resumen"   && <Resumen />}
        {section === "sorteos"   && <Sorteos />}
        {section === "ventas"    && <Ventas />}
        {section === "ganadores" && <Ganadores />}
      </section>
    </main>
  );
};

export default Admin;
