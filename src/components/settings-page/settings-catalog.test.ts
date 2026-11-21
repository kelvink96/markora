import { describe, expect, it } from "vitest";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { SETTINGS_CATALOG, filterSettings } from "./settings-catalog";

const desktop = { desktop: true };
const web = { desktop: false };

function find(id: string) {
  const def = SETTINGS_CATALOG.find((entry) => entry.id === id);
  if (!def) throw new Error(`missing setting ${id}`);
  return def;
}

describe("filterSettings", () => {
  it("returns every setting for a whitespace-only query", () => {
    expect(filterSettings(SETTINGS_CATALOG, "   ", desktop)).toHaveLength(SETTINGS_CATALOG.length);
  });

  it("matches keywords", () => {
    expect(filterSettings(SETTINGS_CATALOG, "night", desktop).map((d) => d.id)).toEqual(["theme"]);
  });

  it("matches labels case-insensitively", () => {
    expect(filterSettings(SETTINGS_CATALOG, "WRAP LONG", desktop).map((d) => d.id)).toEqual(["wordWrap"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterSettings(SETTINGS_CATALOG, "zzz", desktop)).toEqual([]);
  });

  it("hides desktop-only settings on web, even from search", () => {
    expect(filterSettings(SETTINGS_CATALOG, "restore", web)).toEqual([]);
    expect(filterSettings(SETTINGS_CATALOG, "restore", desktop).map((d) => d.id)).toEqual(["restoreSession"]);
    expect(filterSettings(SETTINGS_CATALOG, "", web).map((d) => d.id)).not.toContain("restoreSession");
  });
});

describe("SETTINGS_CATALOG", () => {
  it("has unique ids", () => {
    const ids = SETTINGS_CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("detects and resets a changed line spacing without touching other fields", () => {
    const def = find("lineSpacing");
    const defaults = createDefaultSettings();
    expect(def.isChanged(defaults)).toBe(false);

    const changed = {
      ...defaults,
      appearance: { ...defaults.appearance, editorLineHeight: 1.9, editorFontSize: 20 },
    };
    expect(def.isChanged(changed)).toBe(true);

    const reset = def.reset(changed);
    expect(reset.appearance.editorLineHeight).toBe(1.7);
    expect(reset.appearance.editorFontSize).toBe(20);
  });

  it("offers the default save folder on desktop only, and finds it by search", () => {
    expect(filterSettings(SETTINGS_CATALOG, "save folder", desktop).map((d) => d.id)).toEqual(["saveFolder"]);
    expect(filterSettings(SETTINGS_CATALOG, "", web).map((d) => d.id)).not.toContain("saveFolder");
  });

  it("detects a chosen save folder and resets it to the system default", () => {
    const def = find("saveFolder");
    const defaults = createDefaultSettings();
    expect(def.isChanged(defaults)).toBe(false);

    const chosen = { ...defaults, files: { ...defaults.files, defaultSaveFolder: "/notes", autosave: true } };
    expect(def.isChanged(chosen)).toBe(true);

    const reset = def.reset(chosen);
    expect(reset.files.defaultSaveFolder).toBe("");
    expect(reset.files.autosave).toBe(true);
  });

  it("never reports the template as changed", () => {
    const defaults = createDefaultSettings();
    const edited = { ...defaults, authoring: { newDocumentTemplate: "x" } };
    expect(find("template").isChanged(edited)).toBe(false);
  });
});
