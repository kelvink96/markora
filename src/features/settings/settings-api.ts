import { invoke } from "@tauri-apps/api/core";
import type { MarkoraSettings } from "./settings-schema";

export function loadSettings() {
  return invoke<MarkoraSettings>("load_settings");
}

export function saveSettings(settings: MarkoraSettings) {
  return invoke<MarkoraSettings>("save_settings", { settings });
}

export function resetSettings() {
  return invoke<MarkoraSettings>("reset_settings");
}
