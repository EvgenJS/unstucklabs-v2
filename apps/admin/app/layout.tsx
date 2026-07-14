import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "UnstuckLabs Admin",
    template: "%s — UnstuckLabs Admin",
  },
  robots: { index: false, follow: false },
};

// Required for the CSP nonce in middleware.ts to actually reach the page:
// a per-request nonce can't be baked into a statically-prerendered page (it
// was generated once, at build time, before any request existed), so
// without this every route here was silently served static, the nonce in
// the CSP header never matched the (nonexistent) nonce in the HTML, and
// under 'strict-dynamic' nothing executed at all. Admin is an internal,
// auth-gated panel with no real caching upside anyway (see the identical
// reasoning already applied to Store's homepage in app/page.tsx).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
