import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import pool from "@/lib/db";
import { getClientIp, noContent } from "@/lib/auth/http";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
  setRefreshCookie,
} from "@/lib/auth/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_LOGIN_ERROR = "Correo o contraseña incorrectos.";
const MAX_DB_FAILED_ATTEMPTS = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS) || 5;
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES) || 15;
const DUMMY_PASSWORD_HASH =
  "scrypt$32768$8$1$IZwCF2eMo9zzUa5tMbkhs7dwhSfMjhSL$0NQcGz-SJis9ly9dcsYXB8634hxfu-LAXZHur9bcZQz7I32VQRfUZgZOKGf1jwBNVETM1-s8drxDNeJP0h6vsw";

type UsuarioAuth = {
  id: string;
  correo: string;
  password_hash: string;
  rol: string;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
};

export async function OPTIONS() {
  return noContent();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const correo = String(body?.correo || body?.email || "").trim().toLowerCase();
  const password = String(body?.password || body?.contrasena || "");
  const clientIp = getClientIp(req) || "unknown";
  const rateLimitKey = `login:${clientIp}:${correo || "sin-correo"}`;

  if (!correo || !password || password.length > 512) {
    return NextResponse.json({ success: false, message: GENERIC_LOGIN_ERROR }, { status: 401 });
  }

  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Demasiados intentos. Intenta nuevamente mas tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();

    const { rows } = await client.query<UsuarioAuth>(
      `
        SELECT id, correo, password_hash, rol, activo, intentos_fallidos, bloqueado_hasta
        FROM usuarios
        WHERE correo_normalizado = lower($1)
        LIMIT 1
      `,
      [correo],
    );

    const usuario = rows[0];
    const passwordMatches = await verifyPassword(password, usuario?.password_hash || DUMMY_PASSWORD_HASH);

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ success: false, message: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta.getTime() > Date.now()) {
      return NextResponse.json(
        { success: false, message: "Cuenta bloqueada temporalmente. Intenta nuevamente mas tarde." },
        { status: 423 },
      );
    }

    if (!passwordMatches) {
      const failedAttempts = usuario.intentos_fallidos + 1;
      const shouldLock = failedAttempts >= MAX_DB_FAILED_ATTEMPTS;

      await client.query(
        `
          UPDATE usuarios
          SET
            intentos_fallidos = $2,
            bloqueado_hasta = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE NULL END
          WHERE id = $1
        `,
        [usuario.id, failedAttempts, shouldLock, LOCK_MINUTES],
      );

      return NextResponse.json({ success: false, message: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const accessToken = createAccessToken({
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    const userAgent = req.headers.get("user-agent");

    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO auth_refresh_tokens (usuario_id, token_hash, expira_en, user_agent, ip)
        VALUES ($1, $2, $3, $4, NULLIF($5, '')::inet)
      `,
      [usuario.id, refreshTokenHash, expiresAt, userAgent, clientIp === "unknown" ? "" : clientIp],
    );
    await client.query(
      `
        UPDATE usuarios
        SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login_en = now()
        WHERE id = $1
      `,
      [usuario.id],
    );
    await client.query("COMMIT");
    resetRateLimit(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      accessToken: accessToken.token,
      tokenType: "Bearer",
      expiresIn: accessToken.expiresIn,
    });

    setRefreshCookie(response, refreshToken);
    return response;
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    console.error("Error en login:", error);
    return NextResponse.json({ success: false, message: "No se pudo iniciar sesion." }, { status: 500 });
  } finally {
    client?.release();
  }
}
