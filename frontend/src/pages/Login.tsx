import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, notifyError, notifySuccess } from "@/lib/alerts";
import { useAuth } from "@/lib/AuthContext";

const Login = () => {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/admin";

  useEffect(() => {
    if (status === "authenticated") {
      navigate(from, { replace: true });
    }
  }, [from, navigate, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(correo, password);
      notifySuccess("Sesión iniciada correctamente");
      setPassword("");
      navigate(from, { replace: true });
    } catch (error) {
      notifyError(getErrorMessage(error, "No se pudo iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container grid min-h-screen place-items-center py-12">
        <div className="w-full max-w-md rounded-lg border border-primary/25 bg-card/75 p-6 shadow-luxury backdrop-blur sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo className="mb-4 justify-center" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Acceso privado</p>
            <h1 className="mt-3 text-3xl font-extrabold text-gold-gradient">Grupo Barros</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ingresa con tus credenciales autorizadas.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  className="h-11 pl-10"
                  placeholder="correo@dominio.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 pl-10 pr-10"
                  placeholder="Tu contraseña segura"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
              {loading ? "Validando…" : "Iniciar sesión"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
