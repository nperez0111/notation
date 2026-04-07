import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    react(),
    nitro({
      serverDir: "src/server",
    }),
  ],
  root: "src/mainview",
  build: {
    outDir: "../../.output/public",
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    strictPort: true,
  },
});
