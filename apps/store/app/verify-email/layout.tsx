import type { ReactNode } from "react";

// This route's page.tsx is a "use client" file, so `dynamic` can't be
// exported from it directly -- this thin server-component layout carries
// the config instead. Without it, the page is statically prerendered with
// a stale CSP nonce that 'strict-dynamic' rejects at request time, silently
// blocking every script (including the auto-login call this page makes on
// mount). See middleware.ts and docs/ROADMAP.md's CSP notes.
export const dynamic = "force-dynamic";

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
