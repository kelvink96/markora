import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_NAVIGATION_GROUPS,
} from "./settings-navigation";

describe("settings-navigation", () => {
  it("defines the grouped settings navigation structure", () => {
    expect(DEFAULT_SETTINGS_SECTION).toBe("appearance");
    expect(SETTINGS_NAVIGATION_GROUPS).toEqual([
      {
        title: "Application",
        items: [
          { id: "appearance", label: "Appearance" },
          { id: "editor", label: "Editor" },
          { id: "preview", label: "Preview" },
          { id: "files", label: "Files" },
          { id: "about", label: "About" },
          { id: "advanced", label: "Advanced" },
        ],
      },
      {
        title: "Authoring Defaults",
        items: [{ id: "template", label: "New Document Template" }],
      },
    ]);
  });
});
