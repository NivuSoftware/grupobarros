import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  clearAccessToken,
  fetchCurrentUser,
  getAccessToken,
  loginWithEmail,
  logoutSession,
  refreshAccessToken,
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const loadUserFromToken = useCallback(async (accessToken: string) => {
    const currentUser = await fetchCurrentUser(accessToken);
    setUser(currentUser);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getAccessToken();

      try {
        if (storedToken) {
          try {
            const currentUser = await fetchCurrentUser(storedToken);
            if (!isMounted) return;
            setUser(currentUser);
            setStatus("authenticated");
            return;
          } catch {
            clearAccessToken();
          }
        }

        const refreshedToken = await refreshAccessToken();
        const currentUser = await fetchCurrentUser(refreshedToken);
        if (!isMounted) return;
        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        if (!isMounted) return;
        clearAccessToken();
        setUser(null);
        setStatus("guest");
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (correo: string, password: string) => {
      const response = await loginWithEmail(correo, password);

      if (response.user) {
        setUser(response.user);
        setStatus("authenticated");
        return;
      }

      if (response.accessToken) {
        await loadUserFromToken(response.accessToken);
      }
    },
    [loadUserFromToken],
  );

  const logout = useCallback(async () => {
    await logoutSession();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
    }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
