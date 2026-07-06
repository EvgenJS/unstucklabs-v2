"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth-context";

const links = [
  { href: "/apps", label: "Apps" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-foreground" onClick={() => setMobileOpen(false)}>
          UnstuckLabs
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            <Link
              href={user ? "/account" : "/login"}
              className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              {user ? "My account" : "Log in"}
            </Link>
          )}
        </nav>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-foreground sm:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-4 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-3 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            <Link
              href={user ? "/account" : "/login"}
              className="rounded-lg px-2 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {user ? "My account" : "Log in"}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
