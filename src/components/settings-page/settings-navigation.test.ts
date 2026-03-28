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
          { id: "appearance", label: "Appearance", icon: "palette" },
          { id: "editor", label: "Editor", icon: "pen-square" },
          { id: "files", label: "Files", icon: "folder-open" },
          { id: "about", label: "About", icon: "info" },
          { id: "advanced", label: "Advanced", icon: "sliders-horizontal" },
        ],
      },
      {
        title: "Authoring Defaults",
        items: [{ id: "template", label: "New Document Template", icon: "file-plus-2" }],
      },
    ]);
  });
});
