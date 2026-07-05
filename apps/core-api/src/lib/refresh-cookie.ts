import type { FastifyReply } from "fastify";

export const REFRESH_COOKIE_NAME = "refresh_token";

// domain scoped to the parent (e.g. ".unstucklabs.com") is what makes SSO
// work across the Store and every mini-app subdomain. sameSite MUST be
// "lax", not "strict" -- v1 used "strict" on its refresh cookie, which does
// not survive cross-subdomain top-level navigation and would silently break
// SSO here. Empty COOKIE_DOMAIN (local dev) omits the attribute so cookies
// scope to the exact localhost host/port instead.
export function setRefreshCookie(reply: FastifyReply, token: string): void {
  const domain = process.env.COOKIE_DOMAIN || undefined;

  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    domain,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days, matches REFRESH_TOKEN_TTL in lib/jwt.ts
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  const domain = process.env.COOKIE_DOMAIN || undefined;

  reply.clearCookie(REFRESH_COOKIE_NAME, {
    domain,
    path: "/",
  });
}
