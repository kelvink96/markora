import { useEffect, useRef } from "react";
import { detectPlatform } from "../../platform/runtime";
import { useSettingsStore } from "../settings/settings-store";
import { useUpdateStore } from "./update-store";

/**
 * Checks for an update once per app run, silently, on desktop when the user allows it.
 * The decision is made when the saved settings first load (the store holds defaults
 * before that), so turning the setting on later does not trigger a check.
 */
export function useUpdateCheckOnLaunch() {
  const isHydrated = useSettingsStore((state) => state.isHydrated);
  const checkAutomatically = useSettingsStore((state) => state.settings.updates.checkAutomatically);
  const decided = useRef(false);

  useEffect(() => {
    if (!isHydrated || decided.current) return;
    decided.current = true;

    if (detectPlatform() !== "desktop" || !checkAutomatically) return;
    void useUpdateStore.getState().check({ silent: true });
  }, [isHydrated, checkAutomatically]);
}
