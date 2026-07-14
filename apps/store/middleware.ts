import { NextRequest, NextResponse } from "next/server";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
const isDev = process.env.NODE_ENV === "development";

// CSP lives in middleware, not next.config.ts headers(), because the
// per-request nonce below is what lets script-src stay strict (no
// 'unsafe-inline'/'unsafe-eval') without breaking Next's own inline
// bootstrap scripts (the `self.__next_f.push(...)` RSC-payload scripts the
// App Router injects for hydration) -- Next reads the nonce back off this
// same header and stamps it onto those scripts automatically. Confirmed by
// testing: without the nonce, those inline scripts get blocked and the app
// hydrates to a blank page.
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // No nonce for style-src: next/image's `fill` mode sets a real inline
    // `style` HTML attribute (not a <style> block), which CSP has no nonce
    // mechanism for -- 'unsafe-inline' is the accepted tradeoff for using
    // `fill` (see apps/store/next.config.ts's old comment, now moved here).
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: ${apiUrl.origin}`,
    `font-src 'self'`,
    `connect-src 'self' ${apiUrl.origin}${isDev ? " ws:" : ""}`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
