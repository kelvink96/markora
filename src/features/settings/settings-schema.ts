export type ThemePreference = "system" | "light" | "dark";
export type ColorScheme = "standard" | "sepia" | "high-contrast";

export interface AppearanceSettings {
  theme: ThemePreference;
  colorScheme: ColorScheme;
  editorFontSize: number;
  previewFontScale: number;
  editorLineHeight: number;
  showStatusBar: boolean;
}

export interface EditorSettings {
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
}

export interface PreviewSettings {
  syncScroll: boolean;
  openLinksExternally: boolean;
  contentWidth: "narrow" | "normal" | "wide";
}

export interface FileSettings {
  autosave: boolean;
  restorePreviousSession: boolean;
  confirmOnUnsavedClose: boolean;
}

export interface AuthoringDefaults {
  newDocumentTemplate: string;
}

export interface MarkoraSettings {
  appearance: AppearanceSettings;
  editor: EditorSettings;
  preview: PreviewSettings;
  files: FileSettings;
  authoring: AuthoringDefaults;
}

export const defaultNewDocumentTemplate =
  "# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n\n---\n\n## Quick Start\n\nUse this untitled document to sketch ideas, outlines, or notes before saving.\n\n### Writing Tips\n\n1. Start with a heading structure.\n2. Use lists to break down ideas.\n3. Add code blocks for snippets.\n4. Switch themes when reviewing contrast.\n\n### Sample Checklist\n\n- [ ] Draft the intro\n- [ ] Add key talking points\n- [ ] Review formatting\n- [ ] Save the file\n\n### Notes\n\n> Markora is built for focused writing with a live preview beside your editor.\n\n```ts\nfunction helloMarkora() {\n  return \"Write first, refine later.\";\n}\n```\n\n## Example Outline\n\n### Section One\n\nThis is a larger placeholder block so you can evaluate spacing, rhythm, scrolling, and preview rendering in a more realistic untitled state.\n\n### Section Two\n\nAdd paragraphs, lists, quotes, and code to see how the editor and preview feel with richer content before a document has been saved.\n";

export const defaultSettings: MarkoraSettings = {
  appearance: {
    theme: "system",
    colorScheme: "standard",
    editorFontSize: 15,
    previewFontScale: 1,
    editorLineHeight: 1.6,
    showStatusBar: true,
  },
  editor: {
    wordWrap: true,
    lineNumbers: false,
    highlightActiveLine: true,
  },
  preview: {
    syncScroll: true,
    openLinksExternally: true,
    contentWidth: "normal",
  },
  files: {
    autosave: false,
    restorePreviousSession: false,
    confirmOnUnsavedClose: true,
  },
  authoring: {
    newDocumentTemplate: defaultNewDocumentTemplate,
  },
};

export function createDefaultSettings(): MarkoraSettings {
  return structuredClone(defaultSettings);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Copies `raw`'s values over `defaults`, but only for known keys whose type matches. */
function mergeKnown<T extends object>(defaults: T, raw: unknown): T {
  const merged = { ...defaults };
  if (!isRecord(raw)) return merged;

  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    const value = raw[key];
    if (typeof value === typeof defaults[key] && value !== null) {
      merged[key] = value as T[keyof T & string];
    }
  }
  return merged;
}

function pick<T extends string>(value: T, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/**
 * Turns whatever was stored (older versions, other platforms, hand-edited files) into
 * valid settings: unknown keys are dropped, missing or wrong-typed keys fall back to the
 * defaults, enums and ranges are checked, and the old desktop fixed-point units
 * (line height 160, preview scale 100) are converted to the current ones (1.6, 1).
 */
export function normalizeSettings(raw: unknown): MarkoraSettings {
  const defaults = createDefaultSettings();
  const source = isRecord(raw) ? raw : {};

  const appearance = mergeKnown(defaults.appearance, source.appearance);
  const rawAppearance = isRecord(source.appearance) ? source.appearance : {};
  const legacyLineHeight = Number(rawAppearance.editorLineHeight);
  const legacyScale = Number(rawAppearance.previewFontScale);
  if (legacyLineHeight > 10) appearance.editorLineHeight = legacyLineHeight / 100;
  if (legacyScale > 10) appearance.previewFontScale = legacyScale / 100;

  appearance.theme = pick(appearance.theme, ["system", "light", "dark"], defaults.appearance.theme);
  appearance.colorScheme = pick(
    appearance.colorScheme,
    ["standard", "sepia", "high-contrast"],
    defaults.appearance.colorScheme,
  );
  appearance.editorFontSize = Math.round(
    clamp(appearance.editorFontSize, 12, 24, defaults.appearance.editorFontSize),
  );
  appearance.editorLineHeight = clamp(
    appearance.editorLineHeight,
    1.2,
    2.4,
    defaults.appearance.editorLineHeight,
  );
  appearance.previewFontScale = clamp(
    appearance.previewFontScale,
    0.8,
    1.5,
    defaults.appearance.previewFontScale,
  );

  const preview = mergeKnown(defaults.preview, source.preview);
  preview.contentWidth = pick(
    preview.contentWidth,
    ["narrow", "normal", "wide"],
    defaults.preview.contentWidth,
  );

  return {
    appearance,
    editor: mergeKnown(defaults.editor, source.editor),
    preview,
    files: mergeKnown(defaults.files, source.files),
    authoring: mergeKnown(defaults.authoring, source.authoring),
  };
}
