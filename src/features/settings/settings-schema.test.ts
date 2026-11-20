import { describe, expect, it } from "vitest";
import {
  CURRENT_TOUR_VERSION,
  createDefaultSettings,
  defaultSettings,
  isTourUnseen,
  normalizeSettings,
} from "./settings-schema";

describe("settings-schema", () => {
  it("defaults to the system theme preference", () => {
    expect(defaultSettings.appearance.theme).toBe("system");
  });

  it("defaults to the standard color scheme", () => {
    expect(defaultSettings.appearance.colorScheme).toBe("standard");
  });

  it("dims other paragraphs in Focus by default", () => {
    expect(defaultSettings.editor.focusDimming).toBe(true);
    expect(normalizeSettings({}).editor.focusDimming).toBe(true);
  });

  it("keeps a saved opt-out of Focus dimming", () => {
    expect(normalizeSettings({ editor: { focusDimming: false } }).editor.focusDimming).toBe(false);
  });

  it("ignores a Focus dimming value that is not a boolean", () => {
    expect(normalizeSettings({ editor: { focusDimming: "no" } }).editor.focusDimming).toBe(true);
  });

  it("includes a non-empty new document template", () => {
    expect(defaultSettings.authoring.newDocumentTemplate.trim().length).toBeGreaterThan(0);
  });

  it("welcomes people with a guide rather than placeholder filler", () => {
    const template = defaultSettings.authoring.newDocumentTemplate;

    expect(template.startsWith("# Welcome to Markora")).toBe(true);
    for (const phrase of ["Write", "Side-by-side", "Read", "Show syntax"]) expect(template).toContain(phrase);
    // The four-view names are gone from the app, so the guide must not teach them.
    expect(template).not.toMatch(/\b(Live|Edit|Split|Preview)\b/);
    expect(template).not.toMatch(/Start writing your markdown here|placeholder block|Example Outline/);
  });

  it("returns a fresh copy of defaults each time", () => {
    const first = createDefaultSettings();
    const second = createDefaultSettings();

    first.authoring.newDocumentTemplate = "Changed";

    expect(second.authoring.newDocumentTemplate).toBe(defaultSettings.authoring.newDocumentTemplate);
    expect(first).not.toBe(second);
    expect(first.appearance).not.toBe(second.appearance);
  });
});

describe("normalizeSettings", () => {
  it("returns the defaults for missing or non-object input", () => {
    expect(normalizeSettings(undefined)).toEqual(defaultSettings);
    expect(normalizeSettings(null)).toEqual(defaultSettings);
    expect(normalizeSettings("nope")).toEqual(defaultSettings);
    expect(normalizeSettings([])).toEqual(defaultSettings);
  });

  it("keeps valid stored values", () => {
    const stored = createDefaultSettings();
    stored.appearance.theme = "dark";
    stored.appearance.editorFontSize = 18;
    stored.editor.wordWrap = false;
    stored.files.confirmOnUnsavedClose = false;
    stored.authoring.newDocumentTemplate = "# Mine";

    expect(normalizeSettings(stored)).toEqual(stored);
  });

  it("fills in keys that older saves don't have", () => {
    const result = normalizeSettings({ appearance: { theme: "light" }, files: { autosave: true } });

    expect(result.appearance.theme).toBe("light");
    expect(result.appearance.editorFontSize).toBe(defaultSettings.appearance.editorFontSize);
    expect(result.files.autosave).toBe(true);
    expect(result.files.confirmOnUnsavedClose).toBe(true);
    expect(result.editor).toEqual(defaultSettings.editor);
  });

  it("drops keys that no longer exist", () => {
    const result = normalizeSettings({
      appearance: { splitRatio: 50 },
      editor: { tabSize: 4, softTabs: false },
      preview: { readerTheme: "sepia" },
    });

    expect(result.appearance).not.toHaveProperty("splitRatio");
    expect(result.editor).not.toHaveProperty("tabSize");
    expect(result.editor).not.toHaveProperty("softTabs");
    expect(result.preview).not.toHaveProperty("readerTheme");
  });

  it("converts the old desktop fixed-point units", () => {
    const result = normalizeSettings({
      appearance: { editorLineHeight: 160, previewFontScale: 100 },
    });

    expect(result.appearance.editorLineHeight).toBe(1.6);
    expect(result.appearance.previewFontScale).toBe(1);
  });

  it("moves the old never-applied 15px / 1.6 defaults to the new defaults (#13)", () => {
    const result = normalizeSettings({ appearance: { editorFontSize: 15, editorLineHeight: 1.6 } });

    expect(result.appearance.editorFontSize).toBe(16);
    expect(result.appearance.editorLineHeight).toBe(1.7);
  });

  it("does the same for the old desktop defaults in fixed-point units", () => {
    const result = normalizeSettings({ appearance: { editorFontSize: 15, editorLineHeight: 160 } });

    expect(result.appearance.editorFontSize).toBe(16);
    expect(result.appearance.editorLineHeight).toBe(1.7);
  });

  it("keeps a deliberate size even when it matches one of the old defaults", () => {
    const result = normalizeSettings({ appearance: { editorFontSize: 15, editorLineHeight: 1.9 } });

    expect(result.appearance.editorFontSize).toBe(15);
    expect(result.appearance.editorLineHeight).toBe(1.9);
  });

  it("leaves current-unit values alone", () => {
    const result = normalizeSettings({
      appearance: { editorLineHeight: 1.8, previewFontScale: 1.25 },
    });

    expect(result.appearance.editorLineHeight).toBe(1.8);
    expect(result.appearance.previewFontScale).toBe(1.25);
  });

  it("falls back for wrong types and unknown enum values", () => {
    const result = normalizeSettings({
      appearance: { theme: "neon", colorScheme: 3, editorFontSize: "big", showStatusBar: "yes" },
      editor: { wordWrap: 1 },
      preview: { contentWidth: "huge" },
    });

    expect(result.appearance.theme).toBe("system");
    expect(result.appearance.colorScheme).toBe("standard");
    expect(result.appearance.editorFontSize).toBe(16);
    expect(result.appearance.showStatusBar).toBe(true);
    expect(result.editor.wordWrap).toBe(true);
    expect(result.preview.contentWidth).toBe("normal");
  });

  it("clamps out-of-range numbers", () => {
    const result = normalizeSettings({
      appearance: { editorFontSize: 400, editorLineHeight: 0.2, previewFontScale: 9 },
    });

    expect(result.appearance.editorFontSize).toBe(24);
    expect(result.appearance.editorLineHeight).toBe(1.2);
    expect(result.appearance.previewFontScale).toBe(1.5);
  });

  it("does not share objects with the defaults", () => {
    const result = normalizeSettings({});
    result.appearance.theme = "dark";

    expect(defaultSettings.appearance.theme).toBe("system");
  });
});

describe("update settings", () => {
  it("check automatically by default", () => {
    expect(defaultSettings.updates.checkAutomatically).toBe(true);
  });

  it("treats a save from before updates existed as checking automatically", () => {
    const legacy = normalizeSettings({ appearance: { theme: "dark" } });

    expect(legacy.updates.checkAutomatically).toBe(true);
  });

  it("keeps a stored opt-out and ignores a wrong-typed value", () => {
    expect(normalizeSettings({ updates: { checkAutomatically: false } }).updates).toEqual({
      checkAutomatically: false,
    });
    expect(normalizeSettings({ updates: { checkAutomatically: "no" } }).updates).toEqual({
      checkAutomatically: true,
    });
  });
});

describe("tour version", () => {
  it("is unseen by default", () => {
    expect(defaultSettings.onboarding.tourVersion).toBe(0);
    expect(isTourUnseen(defaultSettings)).toBe(true);
  });

  it("counts a save from before the Tour existed as unseen", () => {
    const legacy = normalizeSettings({ appearance: { theme: "dark" } });

    expect(legacy.onboarding.tourVersion).toBe(0);
    expect(isTourUnseen(legacy)).toBe(true);
  });

  it("is seen once the current version is recorded, and unseen again for a newer tour", () => {
    const settings = normalizeSettings({ onboarding: { tourVersion: CURRENT_TOUR_VERSION } });

    expect(isTourUnseen(settings)).toBe(false);
    expect(isTourUnseen(settings, CURRENT_TOUR_VERSION + 1)).toBe(true);
  });

  it("falls back to unseen for a corrupt recorded version", () => {
    expect(normalizeSettings({ onboarding: { tourVersion: "1" } }).onboarding.tourVersion).toBe(0);
    expect(normalizeSettings({ onboarding: { tourVersion: -3 } }).onboarding.tourVersion).toBe(0);
  });
});
