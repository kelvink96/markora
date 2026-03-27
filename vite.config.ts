import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // Tauri expects the frontend dev server on a fixed port.
  server: { port: 1420, strictPort: true },
  // Allow Vite to expose Tauri-provided environment variables to the frontend build.
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  test: {
    globals: true,
    environment: "jsdom",
    // Run this once before tests so DOM matchers like toBeInTheDocument are available.
    setupFiles: ["./src/test/setup.ts"],
  },
});
