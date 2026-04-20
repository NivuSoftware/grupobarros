import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { noContent } from "@/lib/auth/http";
import { clearRefreshCookie, hashRefreshToken, REFRESH_COOKIE_NAME } from "@/lib/auth/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return noContent();
}

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    await pool.query(
      `
        UPDATE auth_refresh_tokens
        SET revocado_en = COALESCE(revocado_en, now())
        WHERE token_hash = $1
      `,
      [hashRefreshToken(refreshToken)],
    );
  }

  const response = NextResponse.json({ success: true });
  clearRefreshCookie(response);
  return response;
}
