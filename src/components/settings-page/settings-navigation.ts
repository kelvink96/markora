import type { SettingsSection } from "./settings-page-types";

export type SettingsNavigationIcon =
  | "palette"
  | "pen-square"
  | "folder-open"
  | "info"
  | "sliders-horizontal"
  | "file-plus-2";

interface SettingsNavigationItem {
  id: SettingsSection;
  icon: SettingsNavigationIcon;
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
];
