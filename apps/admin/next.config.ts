import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unstucklabs/ui", "@unstucklabs/sdk"],
  // HSTS is deliberately left out here -- TLS termination happens at the
  // Nginx layer in production (deploy/nginx/snippets/security-headers.conf
  // sets it). CSP is in middleware.ts, not here -- it needs a fresh nonce
  // per request, which next.config.ts's static headers() can't generate.
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
