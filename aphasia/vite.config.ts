import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: `crx-${name}-${version}.zip` }),
  ],
  server: {
    port: 6969,
    strictPort: true, // Fail if port is already in use
    host: true, // Listen on all addresses
    open: false, // Don't auto-open browser (extension needs manual loading)
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
  preview: {
    port: 6969,
    strictPort: true,
    host: true,
    open: true, // Auto-open preview when using npm run preview
  },
});
