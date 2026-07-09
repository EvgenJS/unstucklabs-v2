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
        name: "HabitFlow",
        short_name: "HabitFlow",
        description: "Build habits that stick, with an AI coach in your corner.",
        display: "standalone",
        start_url: "/",
        theme_color: "#78716C",
        background_color: "#FFFBEB",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Lightweight, actually-achievable stand-in for a true home-screen
        // widget (not possible from a pure installable PWA without a native
        // wrapper) -- surfaces "Quick check-in" via the OS's long-press/
        // right-click app-icon menu.
        shortcuts: [
          {
            name: "Quick check-in",
            short_name: "Check in",
            url: "/?shortcut=checkin",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
          },
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
  server: { port: 5174 },
});
