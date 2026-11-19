import type { MarkoraSettings } from "../../features/settings/settings-schema";
import { useEffect, useState } from "react";
import type { SettingSection } from "./settings-catalog";
import { DEFAULT_SETTINGS_SECTION } from "./settings-navigation";
import { getSystemThemeMode } from "./settings-page-shared";

interface UseSettingsPageStateOptions {
  settings: MarkoraSettings;
}

export function useSettingsPageState({ settings }: UseSettingsPageStateOptions) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SettingSection>(DEFAULT_SETTINGS_SECTION);
  const [systemThemeMode, setSystemThemeMode] = useState<"light" | "dark">(getSystemThemeMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemThemeMode(event.matches ? "dark" : "light");
    };

    setSystemThemeMode(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const previewThemeMode = settings.appearance.theme === "system" ? systemThemeMode : settings.appearance.theme;

  return { activeSection, previewThemeMode, query, setActiveSection, setQuery };
}
