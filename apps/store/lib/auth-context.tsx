"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@unstucklabs/sdk";
import { getApiClient } from "./api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // Resolves to { verified: false } when the account still needs email
  // verification (the normal case -- see docs/ROADMAP.md) -- no session is
  // created yet, so the caller shouldn't treat this as a login.
  register: (email: string, password: string) => Promise<{ verified: boolean }>;
  // Consumes a verify-email token and, on success, logs the user in --
  // core-api's /auth/verify-email issues a real session on success.
  verifyEmail: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Access token lives in memory only (React state), never localStorage --
// the httpOnly refresh cookie (scoped for cross-subdomain SSO, see
// core-api's lib/refresh-cookie.ts) is what survives a reload. On mount we
// silently call /auth/refresh so a returning visitor with a valid cookie
// doesn't have to log in again.
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

  async function register(email: string, password: string) {
    const result = await getApiClient().auth.register(email, password);
    if (!result.accessToken) {
      // Normal case -- verification email sent, no session yet.
      return { verified: false };
    }
    setAccessToken(result.accessToken);
    const me = await getApiClient(result.accessToken).auth.me();
    setUser(me);
    return { verified: true };
  }

  async function verifyEmail(token: string) {
    const result = await getApiClient().auth.verifyEmail(token);
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
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
