import type { SettingSection } from "./settings-catalog";

export type SettingsNavigationIcon = "palette" | "pen-square" | "eye" | "folder-open";

export const DEFAULT_SETTINGS_SECTION: SettingSection = "appearance";

/** The icon shown beside each section in the jump list. */
export const SECTION_ICONS: Record<SettingSection, SettingsNavigationIcon> = {
  appearance: "palette",
  writing: "pen-square",
  preview: "eye",
  files: "folder-open",
};
