import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5180,
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
  },
});
