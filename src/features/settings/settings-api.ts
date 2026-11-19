import { invoke } from "@tauri-apps/api/core";
import { detectPlatform } from "../../platform/runtime";
import { createDefaultSettings, normalizeSettings, type MarkoraSettings } from "./settings-schema";

const SETTINGS_STORAGE_KEY = "markora:web-settings";
let memorySettings: MarkoraSettings | null = null;

function cloneSettings(settings: MarkoraSettings) {
  return structuredClone(settings);
}

function loadWebSettings() {
  if (memorySettings) {
    return cloneSettings(memorySettings);
  }

  if (typeof localStorage === "undefined") {
    return createDefaultSettings();
  }

  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return createDefaultSettings();
  }

  try {
    // Older saves may lack newer keys or use old units, so always normalize.
    const parsed = normalizeSettings(JSON.parse(raw));
    memorySettings = cloneSettings(parsed);
    return cloneSettings(parsed);
  } catch {
    return createDefaultSettings();
  }
}

function saveWebSettings(settings: MarkoraSettings) {
  memorySettings = cloneSettings(settings);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  return cloneSettings(settings);
}

export function loadSettings() {
  if (detectPlatform() === "web") {
    return Promise.resolve(loadWebSettings());
  }

  return invoke<unknown>("load_settings").then(normalizeSettings);
}

export function saveSettings(settings: MarkoraSettings) {
  if (detectPlatform() === "web") {
    return Promise.resolve(saveWebSettings(settings));
  }

  return invoke<unknown>("save_settings", { settings }).then(normalizeSettings);
}

export function resetSettings() {
  if (detectPlatform() === "web") {
    // Reset restores preferences, not history: the recorded tour version stays.
    const defaults = createDefaultSettings();
    defaults.onboarding = loadWebSettings().onboarding;
    return Promise.resolve(saveWebSettings(defaults));
  }

  return invoke<unknown>("reset_settings").then(normalizeSettings);
}

export function __resetSettingsStorageForTests() {
  memorySettings = null;
}
