"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@unstucklabs/sdk";
import { getApiClient } from "./api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Same access-token-in-memory + httpOnly-refresh-cookie pattern as the Store
// (see apps/store/lib/auth-context.tsx). No register() here -- admin users
// are provisioned via the seed script or by an OWNER granting a role to an
// existing account, not self-service signup.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiClient()
      .auth.refresh()
      .then((result) => {
        setAccessToken(result.accessToken);
        return getApiClient(result.accessToken).auth.me();
      })
      .then(setUser)
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await getApiClient().auth.login(email, password);
    setAccessToken(result.accessToken);
    const me = await getApiClient(result.accessToken).auth.me();
    setUser(me);
  }

  async function logout() {
    await getApiClient(accessToken ?? undefined).auth.logout();
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
