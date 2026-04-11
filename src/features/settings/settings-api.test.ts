import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSettingsStorageForTests,
  loadSettings,
  resetSettings,
  saveSettings,
} from "./settings-api";
import { createDefaultSettings } from "./settings-schema";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("settings-api", () => {
  beforeEach(() => {
    __resetSettingsStorageForTests();
    localStorage.clear();
    invokeMock.mockReset();
  });

  it("loads defaults on web when nothing has been saved", async () => {
    await expect(loadSettings()).resolves.toEqual(createDefaultSettings());
  });

  it("persists settings in localStorage on web", async () => {
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = true;

    await saveSettings(settings);

    await expect(loadSettings()).resolves.toEqual(settings);
  });

  it("resets settings back to defaults on web", async () => {
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = true;

    await saveSettings(settings);
    await resetSettings();

    await expect(loadSettings()).resolves.toEqual(createDefaultSettings());
  });
});
