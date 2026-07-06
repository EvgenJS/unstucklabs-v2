"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

const links = [
  { href: "/apps", label: "Apps" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-foreground">
          UnstuckLabs
        </Link>
        <nav className="flex items-center gap-6">
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
      </div>
    </header>
  );
}
