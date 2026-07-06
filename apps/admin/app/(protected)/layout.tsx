"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { Sidebar } from "../../components/Sidebar";

const ADMIN_ROLES = ["OWNER", "EDITOR", "SUPPORT"];

// Gates every page under this route group behind having at least one admin
// role. This is a UX convenience, NOT the security boundary -- core-api's
// requireRole preHandler is what actually enforces access server-side (see
// apps/core-api/src/modules/admin/rbac.plugin.ts); a user without a role
// simply gets 401/403 from the API even if they somehow reached these pages.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.roles?.some((role) => ADMIN_ROLES.includes(role));

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/login");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
