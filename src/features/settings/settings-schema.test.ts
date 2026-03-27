import { describe, expect, it } from "vitest";
import { createDefaultSettings, defaultSettings } from "./settings-schema";

describe("settings-schema", () => {
  it("defaults to the system theme preference", () => {
    expect(defaultSettings.appearance.theme).toBe("system");
  });

  it("includes a non-empty new document template", () => {
    expect(defaultSettings.authoring.newDocumentTemplate.trim().length).toBeGreaterThan(0);
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
