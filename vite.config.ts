import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg", "icons/icon-192.svg", "icons/icon-512.svg", "offline.html"],
      devOptions: { enabled: mode === "development" },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Runtime route for Supabase - keep API/auth calls network-only
        runtimeCaching: [
          {
            // Match this project's Supabase domain; change to a more general regex if multiple projects are used
            urlPattern: /^https:\/\/sqevpljhffbpqpdhxxgp\.supabase\.co\/.*$/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-api',
            },
          },
        ],
      },
      manifest: {
        name: "Building Blocks",
        short_name: "Blocks",
        description: "Data mapping and transformation toolkit",
        theme_color: "#111827",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
