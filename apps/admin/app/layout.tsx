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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
