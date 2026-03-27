import { create } from "zustand";
import type { ThemePreference } from "../settings/settings-schema";

export type Theme = "light" | "dark";

interface ThemeStore {
  themePreference: ThemePreference;
  resolvedTheme: Theme;
  systemTheme: Theme;
  setThemePreference: (themePreference: ThemePreference) => void;
  setSystemTheme: (systemTheme: Theme) => void;
  toggleTheme: () => void;
}

function resolveTheme(themePreference: ThemePreference, systemTheme: Theme): Theme {
  return themePreference === "system" ? systemTheme : themePreference;
}

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  themePreference: "system",
  resolvedTheme: "light",
  systemTheme: "light",
  setThemePreference: (themePreference) =>
    set((state) => ({
      themePreference,
      resolvedTheme: resolveTheme(themePreference, state.systemTheme),
    })),
  setSystemTheme: (systemTheme) =>
    set((state) => ({
      systemTheme,
      resolvedTheme: resolveTheme(state.themePreference, systemTheme),
    })),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.resolvedTheme === "light" ? "dark" : "light";

      return {
        themePreference: nextTheme,
        resolvedTheme: nextTheme,
      };
    }),
}));
