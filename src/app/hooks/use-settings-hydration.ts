import { useEffect } from "react";
import { loadSettings } from "../../features/settings/settings-api";
import { useSettingsStore } from "../../features/settings/settings-store";

/** Loads the persisted settings once at startup. */
export function useSettingsHydration() {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    let isActive = true;

    loadSettings()
      .then((loadedSettings) => {
        if (!isActive) return;
        hydrateSettings(loadedSettings);
      })
      .catch((error) => console.error("load_settings failed:", error));

    return () => {
      isActive = false;
    };
  }, [hydrateSettings]);
}
