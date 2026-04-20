import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import pool from "@/lib/db";
import { getClientIp, noContent } from "@/lib/auth/http";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  setRefreshCookie,
} from "@/lib/auth/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RefreshTokenRecord = {
  id: string;
  familia_id: string;
  usuario_id: string;
  correo: string;
  rol: string;
  activo: boolean;
};

export async function OPTIONS() {
  return noContent();
}

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: "Sesion no encontrada." }, { status: 401 });
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const { rows } = await client.query<RefreshTokenRecord>(
      `
        SELECT
          rt.id,
          rt.familia_id,
          rt.usuario_id,
          u.correo,
          u.rol,
          u.activo
        FROM auth_refresh_tokens rt
        JOIN usuarios u ON u.id = rt.usuario_id
        WHERE rt.token_hash = $1
          AND rt.revocado_en IS NULL
          AND rt.expira_en > now()
        FOR UPDATE
      `,
      [refreshTokenHash],
    );

    const record = rows[0];

    if (!record || !record.activo) {
      await client.query("COMMIT");
      return NextResponse.json({ success: false, message: "Sesion expirada." }, { status: 401 });
    }

    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    const userAgent = req.headers.get("user-agent");
    const clientIp = getClientIp(req) || "";

    const inserted = await client.query<{ id: string }>(
      `
        INSERT INTO auth_refresh_tokens (usuario_id, token_hash, familia_id, expira_en, user_agent, ip)
        VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::inet)
        RETURNING id
      `,
      [record.usuario_id, newRefreshTokenHash, record.familia_id, expiresAt, userAgent, clientIp],
    );

    await client.query(
      `
        UPDATE auth_refresh_tokens
        SET revocado_en = now(), reemplazado_por = $2
        WHERE id = $1
      `,
      [record.id, inserted.rows[0].id],
    );

    await client.query("COMMIT");

    const accessToken = createAccessToken({
      sub: record.usuario_id,
      correo: record.correo,
      rol: record.rol,
    });
    const response = NextResponse.json({
      success: true,
      accessToken: accessToken.token,
      tokenType: "Bearer",
      expiresIn: accessToken.expiresIn,
    });

    setRefreshCookie(response, newRefreshToken);
    return response;
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    console.error("Error al refrescar token:", error);
    return NextResponse.json({ success: false, message: "No se pudo renovar la sesion." }, { status: 500 });
  } finally {
    client?.release();
  }
}
