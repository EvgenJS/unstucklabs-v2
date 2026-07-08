import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw-push.ts",
      injectRegister: "auto",
      manifest: {
        name: "Unstuck Daily",
        short_name: "Unstuck Daily",
        description: "Break big tasks into small steps, one at a time.",
        display: "standalone",
        start_url: "/",
        theme_color: "#6366F1",
        background_color: "#F5F5FF",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: { enabled: true, type: "module" },
      injectManifest: {
        // App shell only -- core-api is a different origin, so auth/AI/data
        // requests are never intercepted by the service worker at all.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: { port: 5173 },
});
