import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  setTheme: (theme) => set({ theme }),
  // Keep the toggle logic local to the store so components only call one action.
  toggleTheme: () =>
    set({ theme: get().theme === "light" ? "dark" : "light" }),
}));
