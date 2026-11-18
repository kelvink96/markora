import { useEffect } from "react";
import { useSettingsStore } from "../../features/settings/settings-store";
import { useThemeStore } from "../../features/theme/theme-store";

function getSystemThemePreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies the saved theme preference and follows the operating system's light/dark setting. */
export function useThemeSync() {
  const themeSetting = useSettingsStore((state) => state.settings.appearance.theme);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme);

  useEffect(() => {
    setThemePreference(themeSetting);
  }, [setThemePreference, themeSetting]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    setSystemTheme(getSystemThemePreference());
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setSystemTheme]);
}
