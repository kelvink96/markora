export type MarkoraPlatform = "desktop" | "web";

export function detectPlatform(win: Window | undefined = typeof window === "undefined" ? undefined : window) {
  if (typeof import.meta !== "undefined" && import.meta.env.TAURI_ENV_PLATFORM) {
    return "desktop" as const;
  }

  if (win && "__TAURI_INTERNALS__" in win) {
    return "desktop" as const;
  }

  return "web" as const;
}
