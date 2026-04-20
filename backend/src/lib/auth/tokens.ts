import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = "gb_refresh_token";

type AccessTokenPayload = {
  sub: string;
  correo: string;
  rol: string;
};

type JwtPayload = AccessTokenPayload & {
  iss: string;
  aud: string;
  typ: "access";
  iat: number;
  exp: number;
};

function getJwtSecret(): Buffer {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");
  }

  return Buffer.from(secret);
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(input: string): string {
  return createHmac("sha256", getJwtSecret()).update(input).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function createAccessToken(payload: AccessTokenPayload): { token: string; expiresIn: number } {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body: JwtPayload = {
    ...payload,
    iss: process.env.JWT_ISSUER || "grupobarros-api",
    aud: process.env.JWT_AUDIENCE || "grupobarros-frontend",
    typ: "access",
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  };
  const unsignedToken = `${base64UrlJson(header)}.${base64UrlJson(body)}`;

  return {
    token: `${unsignedToken}.${sign(unsignedToken)}`,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  const [headerPart, payloadPart, signature] = token.split(".");

  if (!headerPart || !payloadPart || !signature) {
    throw new Error("Token invalido.");
  }

  const expectedSignature = sign(`${headerPart}.${payloadPart}`);
  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("Firma invalida.");
  }

  const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Cabecera de token invalida.");
  }

  if (
    payload.typ !== "access" ||
    payload.iss !== (process.env.JWT_ISSUER || "grupobarros-api") ||
    payload.aud !== (process.env.JWT_AUDIENCE || "grupobarros-frontend") ||
    payload.exp <= now
  ) {
    throw new Error("Token expirado o invalido.");
  }

  return payload;
}

export function createRefreshToken(): string {
  return randomBytes(64).toString("base64url");
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash("sha256").update(refreshToken).digest("hex");
}

export function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });
}
