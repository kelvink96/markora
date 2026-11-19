import {
  defaultSettings,
  type AppearanceSettings,
  type EditorSettings,
  type FileSettings,
  type MarkoraSettings,
  type PreviewSettings,
} from "../../features/settings/settings-schema";

export type SettingSection = "appearance" | "writing" | "preview" | "files";

export const SETTING_SECTIONS: Array<{ id: SettingSection; title: string }> = [
  { id: "appearance", title: "Appearance" },
  { id: "writing", title: "Writing" },
  { id: "preview", title: "Preview" },
  { id: "files", title: "Files" },
];

export interface SettingDefinition {
  id: string;
  section: SettingSection;
  label: string;
  description?: string;
  keywords: string[];
  /** Hidden on web, including from search results. */
  desktopOnly?: boolean;
  isChanged(settings: MarkoraSettings): boolean;
  reset(settings: MarkoraSettings): MarkoraSettings;
}

type Group = "appearance" | "editor" | "preview" | "files";
type GroupShape = {
  appearance: AppearanceSettings;
  editor: EditorSettings;
  preview: PreviewSettings;
  files: FileSettings;
};

/** A setting backed by one field of one settings group; changed/reset compare against the defaults. */
function field<G extends Group>(
  group: G,
  key: keyof GroupShape[G],
  meta: Pick<SettingDefinition, "id" | "section" | "label" | "description" | "keywords" | "desktopOnly">,
): SettingDefinition {
  return {
    ...meta,
    isChanged: (settings) => settings[group][key] !== defaultSettings[group][key],
    reset: (settings) => ({
      ...settings,
      [group]: { ...settings[group], [key]: defaultSettings[group][key] },
    }),
  };
}

export const SETTINGS_CATALOG: SettingDefinition[] = [
  field("appearance", "theme", {
    id: "theme",
    section: "appearance",
    label: "Theme mode",
    description: "System follows your OS color scheme.",
    keywords: ["dark", "light", "system", "night"],
  }),
  field("appearance", "colorScheme", {
    id: "colorScheme",
    section: "appearance",
    label: "Color scheme",
    description: "The palette the whole app uses in light and dark modes.",
    keywords: ["aurora", "ember", "sepia", "high contrast", "palette", "accent"],
  }),
  field("appearance", "showStatusBar", {
    id: "statusBar",
    section: "appearance",
    label: "Show footer metrics",
    keywords: ["status bar", "word count", "footer"],
  }),
  field("appearance", "editorFontSize", {
    id: "fontSize",
    section: "writing",
    label: "Editor font size",
    keywords: ["text size", "zoom", "bigger", "smaller"],
  }),
  field("appearance", "editorLineHeight", {
    id: "lineSpacing",
    section: "writing",
    label: "Editor line spacing",
    keywords: ["line height", "leading", "compact", "relaxed"],
  }),
  field("editor", "wordWrap", {
    id: "wordWrap",
    section: "writing",
    label: "Wrap long lines",
    keywords: ["word wrap", "overflow"],
  }),
  field("editor", "lineNumbers", {
    id: "lineNumbers",
    section: "writing",
    label: "Show line numbers",
    keywords: ["gutter"],
  }),
  field("editor", "highlightActiveLine", {
    id: "activeLine",
    section: "writing",
    label: "Highlight the current line",
    keywords: ["cursor line", "active line"],
  }),
  field("appearance", "previewFontScale", {
    id: "previewScale",
    section: "preview",
    label: "Preview text size",
    keywords: ["zoom", "scale", "font"],
  }),
  field("preview", "contentWidth", {
    id: "lineWidth",
    section: "preview",
    label: "Line width",
    keywords: ["content width", "narrow", "wide", "measure"],
  }),
  field("preview", "syncScroll", {
    id: "syncScroll",
    section: "preview",
    label: "Scroll the editor and preview together",
    description: "Applies whenever the editor and preview are side by side.",
    keywords: ["synchronized", "split"],
  }),
  field("preview", "openLinksExternally", {
    id: "openLinks",
    section: "preview",
    label: "Open links in your browser",
    description: "When off, links in the preview do nothing, so you can't leave your document by accident.",
    keywords: ["hyperlink", "url", "external"],
  }),
  field("files", "autosave", {
    id: "autosave",
    section: "files",
    label: "Save changes automatically",
    description: "Saves a moment after you stop typing. Untitled documents are skipped until you save them once.",
    keywords: ["autosave", "auto save", "save"],
  }),
  field("files", "restorePreviousSession", {
    id: "restoreSession",
    section: "files",
    label: "Reopen last session's files on launch",
    description: "Brings back the saved files you had open, and the one you were on.",
    keywords: ["restore", "reopen", "startup", "tabs"],
    desktopOnly: true,
  }),
  field("files", "confirmOnUnsavedClose", {
    id: "confirmClose",
    section: "files",
    label: "Confirm before closing unsaved tabs",
    keywords: ["unsaved", "discard", "prompt"],
  }),
  {
    id: "template",
    section: "files",
    label: "New document template",
    description: "The content new documents start with.",
    keywords: ["default text", "boilerplate", "starter"],
    isChanged: () => false,
    reset: (settings) => settings,
  },
];

export function filterSettings(
  definitions: SettingDefinition[],
  query: string,
  { desktop }: { desktop: boolean },
): SettingDefinition[] {
  const needle = query.trim().toLowerCase();
  return definitions.filter((definition) => {
    if (definition.desktopOnly && !desktop) return false;
    if (!needle) return true;
    return [definition.label, definition.description ?? "", ...definition.keywords].some((text) =>
      text.toLowerCase().includes(needle),
    );
  });
}
