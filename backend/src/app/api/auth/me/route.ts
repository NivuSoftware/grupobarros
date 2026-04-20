import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getBearerToken, noContent } from "@/lib/auth/http";
import { verifyAccessToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return noContent();
}

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);

  if (!token) {
    return NextResponse.json({ success: false, message: "Token requerido." }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);
    const { rows } = await pool.query<{ id: string; correo: string; nombre: string | null; rol: string }>(
      `
        SELECT id, correo, nombre, rol
        FROM usuarios
        WHERE id = $1 AND activo = true
        LIMIT 1
      `,
      [payload.sub],
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Token invalido o expirado." }, { status: 401 });
  }
}
