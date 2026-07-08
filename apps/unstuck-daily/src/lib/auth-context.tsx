import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@unstucklabs/sdk";
import { getApiClient } from "./api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Near-verbatim port of apps/store/lib/auth-context.tsx (SSO relies on the
// same httpOnly refresh cookie both apps talk to). No login/register here --
// this mini-app has no account UI of its own; an unauthenticated visitor is
// sent to the Store to log in (see SubscriptionGate).
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

  async function logout() {
    await getApiClient(accessToken ?? undefined).auth.logout();
    setUser(null);
    setAccessToken(null);
  }

  return <AuthContext.Provider value={{ user, accessToken, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
