import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Self-hosted via next/font (replaces the old Google Fonts @import in
// globals.css): avoids the extra render-blocking round-trip and gets
// font-display/preload wired up automatically. Feeds the same --font-sans
// token packages/ui already uses -- see the :root override in globals.css.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UnstuckLabs — Small tools that get you unstuck",
    template: "%s — UnstuckLabs",
  },
  description:
    "Small, focused productivity and wellness tools for people who struggle to get started — built by someone who needed them too.",
  openGraph: {
    type: "website",
    siteName: "UnstuckLabs",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "UnstuckLabs",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      founder: { "@type": "Person", name: "Yevhen Spatar" },
    },
    {
      "@type": "WebSite",
      name: "UnstuckLabs",
      url: siteUrl,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
