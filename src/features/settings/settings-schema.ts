export type ThemePreference = "system" | "light" | "dark";
export type ColorScheme = "standard" | "sepia" | "high-contrast";

export interface AppearanceSettings {
  theme: ThemePreference;
  colorScheme: ColorScheme;
  editorFontSize: number;
  previewFontScale: number;
  editorLineHeight: number;
  splitRatio: number;
  showStatusBar: boolean;
}

export interface EditorSettings {
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  tabSize: number;
  softTabs: boolean;
}

export interface PreviewSettings {
  syncScroll: boolean;
  openLinksExternally: boolean;
  contentWidth: "narrow" | "normal" | "wide";
  readerTheme: "paper" | "dark" | "sepia" | "high-contrast";
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
    splitRatio: 0.5,
    showStatusBar: true,
  },
  editor: {
    wordWrap: true,
    lineNumbers: false,
    highlightActiveLine: true,
    tabSize: 2,
    softTabs: true,
  },
  preview: {
    syncScroll: true,
    openLinksExternally: true,
    contentWidth: "normal",
    readerTheme: "paper",
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
