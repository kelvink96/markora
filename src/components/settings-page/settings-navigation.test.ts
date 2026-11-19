import { describe, expect, it } from "vitest";
import { SETTING_SECTIONS } from "./settings-catalog";
import { DEFAULT_SETTINGS_SECTION, SECTION_ICONS } from "./settings-navigation";

describe("settings-navigation", () => {
  it("starts on appearance and has an icon for every section", () => {
    expect(DEFAULT_SETTINGS_SECTION).toBe("appearance");
    expect(SETTING_SECTIONS.map((section) => section.id)).toEqual(["appearance", "writing", "preview", "files"]);
    for (const section of SETTING_SECTIONS) {
      expect(SECTION_ICONS[section.id]).toBeTruthy();
    }
  });
});
