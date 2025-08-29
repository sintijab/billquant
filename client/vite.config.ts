import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
            '/api': {
                target: 'https://billquant-production.up.railway.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            '/pat': {
                target: 'https://billquant-pat-production.up.railway.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/pat/, '')
            },
            '/dei': {
                target: 'https://billquant-dei-production.up.railway.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/dei/, '')
            },
            '/piemonte': {
                target: 'https://billquant-piemonte-production.up.railway.app',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/piemonte/, '')
            }
    },
    port: 5173,
    strictPort: true,
    origin: `http://0.0.0.0:5173`,
    cors: {
      origin: [/^http:\/\/127\.0\.0\.1:8000$/],
    },
  },
});
