import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Uses vite-plugin-pwa's default "generateSW" strategy (unlike Unstuck
// Daily/HabitFlow's "injectManifest") -- FishCast has no push-notification
// feature (the client declined proactive push for now, see docs/ROADMAP.md
// Future/Backlog), so there's no custom service-worker code to inject.
// generateSW's automatic app-shell precaching is all this app needs; if
// push gets added later, swapping to injectManifest is the same well-
// understood migration already done twice for the other two mini-apps.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "FishCast — AI Fishing Forecast",
        short_name: "FishCast",
        description: "AI-powered GO/WAIT fishing forecasts, lure picks, and a catch log that learns your spots.",
        display: "standalone",
        start_url: "/",
        theme_color: "#0B1426",
        background_color: "#0B1426",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: { enabled: true, type: "module" },
      workbox: {
        // App shell only -- core-api is a different origin, so auth/AI/data
        // requests are never intercepted by the service worker at all.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: { port: 5175 },
});
