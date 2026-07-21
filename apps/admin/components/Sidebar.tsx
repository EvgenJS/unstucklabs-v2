"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Users, CreditCard, FileText, Lightbulb, Mail, Tag, LogOut, Receipt } from "lucide-react";
import { useAuth } from "../lib/auth-context";

const navItems = [
  // Products, Promo Codes, and Blog admin routes are OWNER/EDITOR only in
  // core-api (no SUPPORT read access, unlike Subscriptions/Users/App
  // Requests/Contact Messages) -- gated here too so SUPPORT doesn't land on
  // a page that 403s on every request.
  { href: "/products", label: "Products", icon: Package, roles: ["OWNER", "EDITOR"] },
  { href: "/promo-codes", label: "Promo Codes", icon: Tag, roles: ["OWNER", "EDITOR"] },
  { href: "/users", label: "Users", icon: Users, roles: ["OWNER", "EDITOR", "SUPPORT"] },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard, roles: ["OWNER", "EDITOR", "SUPPORT"] },
  {
    href: "/manual-payment-requests",
    label: "Manual Payment Requests",
    icon: Receipt,
    roles: ["OWNER", "EDITOR", "SUPPORT"],
  },
  { href: "/blog", label: "Blog", icon: FileText, roles: ["OWNER", "EDITOR"] },
  { href: "/app-requests", label: "App Requests", icon: Lightbulb, roles: ["OWNER", "EDITOR", "SUPPORT"] },
  { href: "/contact-messages", label: "Contact Messages", icon: Mail, roles: ["OWNER", "EDITOR", "SUPPORT"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const visibleItems = navItems.filter((item) => item.roles.some((role) => user?.roles?.includes(role as never)));

  return (
    <aside className="flex h-dvh w-56 flex-col border-r border-border bg-white">
      <div className="px-4 py-5">
        <p className="font-bold text-foreground">UnstuckLabs</p>
        <p className="text-xs text-foreground/50">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="truncate text-xs text-foreground/50">{user?.email}</p>
        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </div>
    </aside>
  );
}
