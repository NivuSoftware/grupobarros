import { NextRequest, NextResponse } from "next/server";
import { isIP } from "net";

export function getClientIp(req: NextRequest): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const candidate = forwardedFor || realIp || null;

  return candidate && isIP(candidate) ? candidate : null;
}

export function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
