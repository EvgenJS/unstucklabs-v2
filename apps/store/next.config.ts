import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const nextConfig: NextConfig = {
  transpilePackages: ["@unstucklabs/ui", "@unstucklabs/sdk"],
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
      },
    ],
  },
  // HSTS/CSP are deliberately left out here -- TLS termination and
  // subdomain routing already happen at the Nginx layer in production
  // (deploy/nginx/snippets/security-headers.conf sets HSTS; CSP is left out
  // there too since each app's own script/style sources differ too much for
  // one shared policy). The three headers below duplicate what Nginx already
  // sets in production, but they're harmless defense-in-depth and matter for
  // `next dev`/`next start` run standalone, without Nginx in front.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
