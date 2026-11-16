import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Versionsangabe für die Einstellungen: Datum des Builds und (bei Vercel) Commit
const build = new Date().toISOString().slice(0, 16).replace("T", " ");
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const commit = env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "lokal";

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(`${build} · ${commit}`),
  },
  plugins: [
    VitePWA({
      // Neue Versionen werden beim nächsten Öffnen automatisch übernommen
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Übungscoach",
        short_name: "Übungscoach",
        description: "Führt per Sprachansage durch Physio-Übungen.",
        lang: "de",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#F6F4F6",
        background_color: "#F6F4F6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Schrift von Google Fonts auch offline verfügbar machen
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "schriften",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
