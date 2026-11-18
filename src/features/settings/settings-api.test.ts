import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("migrates an older web save that lacks newer keys and uses removed ones", async () => {
    localStorage.setItem(
      "markora:web-settings",
      JSON.stringify({
        appearance: { theme: "dark", splitRatio: 0.5 },
        editor: { lineNumbers: true, tabSize: 4 },
        files: { confirmOnUnsavedClose: false },
      }),
    );

    const loaded = await loadSettings();

    expect(loaded.appearance.theme).toBe("dark");
    expect(loaded.appearance.editorFontSize).toBe(16);
    expect(loaded.editor.lineNumbers).toBe(true);
    expect(loaded.editor.wordWrap).toBe(true);
    expect(loaded.editor).not.toHaveProperty("tabSize");
    expect(loaded.files.confirmOnUnsavedClose).toBe(false);
  });

  it("falls back to defaults when the stored web settings are corrupt", async () => {
    localStorage.setItem("markora:web-settings", "{not json");

    await expect(loadSettings()).resolves.toEqual(createDefaultSettings());
  });

  describe("on desktop", () => {
    beforeEach(() => {
      Object.assign(window, { __TAURI_INTERNALS__: {} });
    });

    afterEach(() => {
      Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
    });

    it("converts the old fixed-point units that earlier desktop versions saved", async () => {
      const legacy = createDefaultSettings();
      Object.assign(legacy.appearance, { editorLineHeight: 160, previewFontScale: 100 });
      invokeMock.mockResolvedValue(legacy);

      const loaded = await loadSettings();

      expect(invokeMock).toHaveBeenCalledWith("load_settings");
      expect(loaded.appearance.editorLineHeight).toBe(1.6);
      expect(loaded.appearance.previewFontScale).toBe(1);
    });

    it("sends settings to the Rust save command", async () => {
      const settings = createDefaultSettings();
      invokeMock.mockResolvedValue(settings);

      await saveSettings(settings);

      expect(invokeMock).toHaveBeenCalledWith("save_settings", { settings });
    });

    it("returns normalized defaults from reset", async () => {
      invokeMock.mockResolvedValue({ appearance: { theme: "light" } });

      const reset = await resetSettings();

      expect(reset.appearance.theme).toBe("light");
      expect(reset.editor).toEqual(createDefaultSettings().editor);
    });
  });
});
