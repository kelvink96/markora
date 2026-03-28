import type { SettingsSection } from "./settings-page-types";

interface SettingsNavigationItem {
  id: SettingsSection;
  label: string;
}

interface SettingsNavigationGroup {
  title: string;
  items: SettingsNavigationItem[];
}

export const DEFAULT_SETTINGS_SECTION: SettingsSection = "appearance";

export const SETTINGS_NAVIGATION_GROUPS: SettingsNavigationGroup[] = [
  {
    title: "Application",
    items: [
      { id: "appearance", label: "Appearance" },
      { id: "editor", label: "Editor" },
      { id: "files", label: "Files" },
      { id: "about", label: "About" },
      { id: "advanced", label: "Advanced" },
    ],
  },
  {
    title: "Authoring Defaults",
    items: [{ id: "template", label: "New Document Template" }],
  },
];
