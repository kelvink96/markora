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

export interface OnboardingSettings {
  /** The Tour version the user last finished or skipped; 0 means they are unseen. */
  tourVersion: number;
}

export interface UpdateSettings {
  /** Check for a new version once when the desktop app starts. */
  checkAutomatically: boolean;
}

export interface MarkoraSettings {
  appearance: AppearanceSettings;
  editor: EditorSettings;
  preview: PreviewSettings;
  files: FileSettings;
  authoring: AuthoringDefaults;
  onboarding: OnboardingSettings;
  updates: UpdateSettings;
}

/** Bump this when the Tour changes enough that people who saw it should be offered it again. */
export const CURRENT_TOUR_VERSION = 1;

/** True when the user should be offered the Tour prompt. */
export function isTourUnseen(
  settings: MarkoraSettings,
  currentVersion: number = CURRENT_TOUR_VERSION,
): boolean {
  return settings.onboarding.tourVersion < currentVersion;
}

/** The editor font sizes (px) the settings stepper and the Zoom commands move through. */
export const EDITOR_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 24];

/** The preview text scales the settings select and the Zoom commands move through. */
export const PREVIEW_SCALES = [0.9, 1, 1.1, 1.25, 1.5];

export const defaultNewDocumentTemplate =
  "# Welcome to Markora\n\nThis is a scratch note. In Live view it renders as you type, and the line you are on shows its raw markdown.\n\n## Try it\n\n- Select some text to format it, or type `/` for the command menu\n- Switch between Live, Edit, Split and Preview with the buttons at the top right\n- Open the outline to jump between headings\n\n## Make it yours\n\n- [ ] Change the first heading to rename this note\n- [ ] Save with Ctrl+S\n- [ ] Pick a light or dark theme from the toolbar\n\n> Markdown is plain text, so your notes stay yours.\n\n```ts\nfunction hello() {\n  return \"Write first, refine later.\";\n}\n```\n";

export const defaultSettings: MarkoraSettings = {
  appearance: {
    theme: "system",
    colorScheme: "standard",
    // 16px / 1.7 is what the editor has always rendered at.
    editorFontSize: 16,
    previewFontScale: 1,
    editorLineHeight: 1.7,
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
  onboarding: {
    tourVersion: 0,
  },
  updates: {
    checkAutomatically: true,
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

  // Earlier versions saved 15px / 1.6 as defaults but never applied them (the editor
  // rendered at 16px / 1.72) and had no control to change them, so that exact pair is
  // the old default, not a choice. Move it to the new default so nothing shrinks.
  if (appearance.editorFontSize === 15 && appearance.editorLineHeight === 1.6) {
    appearance.editorFontSize = defaults.appearance.editorFontSize;
    appearance.editorLineHeight = defaults.appearance.editorLineHeight;
  }

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

  const onboarding = mergeKnown(defaults.onboarding, source.onboarding);
  onboarding.tourVersion = Math.floor(
    clamp(onboarding.tourVersion, 0, Number.MAX_SAFE_INTEGER, defaults.onboarding.tourVersion),
  );

  return {
    appearance,
    editor: mergeKnown(defaults.editor, source.editor),
    preview,
    files: mergeKnown(defaults.files, source.files),
    authoring: mergeKnown(defaults.authoring, source.authoring),
    onboarding,
    updates: mergeKnown(defaults.updates, source.updates),
  };
}
