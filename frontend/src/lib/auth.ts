const rawApiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const apiBaseUrl = rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl;

const ACCESS_TOKEN_KEY = "grupobarros_access_token";

export type AuthUser = {
  id: string;
  correo: string;
  nombre?: string | null;
  rol: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  accessToken?: string;
  tokenType?: "Bearer";
  expiresIn?: number;
  user?: AuthUser;
};

type MeResponse = {
  success: boolean;
  message?: string;
  user?: AuthUser;
};

function apiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function saveAccessToken(token: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage failures and still clear the fallback below.
  }
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function loginWithEmail(correo: string, password: string): Promise<LoginResponse> {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ correo, password }),
  });

  const data = (await response.json().catch(() => ({
    success: false,
    message: "No se pudo leer la respuesta del servidor.",
  }))) as LoginResponse;

  if (!response.ok) {
    throw new Error(data.message || "No se pudo iniciar sesion.");
  }

  if (!data.accessToken) {
    throw new Error("El servidor no devolvio un token de acceso.");
  }

  saveAccessToken(data.accessToken);
  return data;
}

export async function refreshAccessToken(): Promise<string> {
  const response = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  const data = (await response.json().catch(() => null)) as LoginResponse | null;

  if (!response.ok || !data?.accessToken) {
    clearAccessToken();
    throw new Error(data?.message || "Sesion expirada.");
  }

  saveAccessToken(data.accessToken);
  return data.accessToken;
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const response = await fetch(apiUrl("/api/auth/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  const data = (await response.json().catch(() => null)) as MeResponse | null;

  if (!response.ok || !data?.user) {
    throw new Error(data?.message || "No se pudo validar la sesion.");
  }

  return data.user;
}

export async function logoutSession() {
  await fetch(apiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);

  clearAccessToken();
}
