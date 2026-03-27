import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  // Per Vite's config docs, only env vars already present in the current
  // process are available while vite.config.ts is being evaluated.
  const tauriPlatform = process.env.TAURI_ENV_PLATFORM;
  const tauriDebug = process.env.TAURI_ENV_DEBUG;
  const minify: false | "esbuild" = tauriDebug ? false : "esbuild";

  return {
    plugins: [react()],
    clearScreen: false,
    // Tauri expects the frontend dev server on a fixed port.
    // Force IPv4 here because this Windows environment rejects binding to ::1.
    server: { host: "127.0.0.1", port: 1420, strictPort: true },
    // This prefix controls which env vars are exposed to browser code through import.meta.env.
    envPrefix: ["VITE_", "TAURI_ENV_*"],
    build: {
      target: tauriPlatform === "windows" ? "chrome105" : "safari13",
      minify,
      sourcemap: !!tauriDebug,
    },
    test: {
      globals: true,
      environment: "jsdom",
      // Run this once before tests so DOM matchers like toBeInTheDocument are available.
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
