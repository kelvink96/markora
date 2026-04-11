import { invoke } from "@tauri-apps/api/core";
import { detectPlatform } from "../../platform/runtime";
import { createDefaultSettings, type MarkoraSettings } from "./settings-schema";

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
    const parsed = JSON.parse(raw) as MarkoraSettings;
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

  return invoke<MarkoraSettings>("load_settings");
}

export function saveSettings(settings: MarkoraSettings) {
  if (detectPlatform() === "web") {
    return Promise.resolve(saveWebSettings(settings));
  }

  return invoke<MarkoraSettings>("save_settings", { settings });
}

export function resetSettings() {
  if (detectPlatform() === "web") {
    const defaults = createDefaultSettings();
    return Promise.resolve(saveWebSettings(defaults));
  }

  return invoke<MarkoraSettings>("reset_settings");
}

export function __resetSettingsStorageForTests() {
  memorySettings = null;
}
