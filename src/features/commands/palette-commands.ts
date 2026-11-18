import type { EditorEditAction } from "../editor/editor-command-state";
import type { MarkdownToolbarAction } from "../editor/markdown-toolbar-actions";
import type { WorkspaceViewMode } from "../workspace/workspace-state";

export type PaletteGroup = "File" | "Edit" | "Format" | "View" | "App" | "Help";

export interface PaletteCommand {
  id: string;
  label: string;
  group: PaletteGroup;
  /** Shown beside the command, e.g. "Ctrl+S". Only set when a real shortcut exists. */
  shortcut?: string;
  /** Extra words the search also matches, e.g. "bold" for "Bold" is already in the label, "strong" is not. */
  keywords?: string[];
  run: () => void;
}

export interface PaletteHandlers {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onCloseTab: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onToggleOutline: () => void;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  onFormat: (action: MarkdownToolbarAction) => void;
  onEditAction: (action: EditorEditAction) => void;
  onOpenShortcuts: () => void;
  onOpenReleaseNotes: () => void;
  onOpenAbout: () => void;
}

export interface PaletteContext {
  /** "Ctrl" or "Cmd", from getModifierLabel(). */
  modifier: string;
  hasActiveDocument: boolean;
  viewMode: WorkspaceViewMode;
  showOutline: boolean;
  handlers: PaletteHandlers;
}

const VIEW_MODES: Array<{ mode: WorkspaceViewMode; label: string; keywords: string[] }> = [
  { mode: "edit", label: "Editor only", keywords: ["edit", "write", "focus"] },
  { mode: "split", label: "Split view", keywords: ["side by side", "live preview"] },
  { mode: "preview", label: "Preview only", keywords: ["read", "rendered"] },
];

const FORMAT_COMMANDS: Array<{ action: MarkdownToolbarAction; label: string; keywords?: string[] }> = [
  { action: "heading", label: "Heading", keywords: ["title", "h1"] },
  { action: "bold", label: "Bold", keywords: ["strong"] },
  { action: "italic", label: "Italic", keywords: ["emphasis"] },
  { action: "strike", label: "Strikethrough", keywords: ["strike"] },
  { action: "bulletList", label: "Bullet list", keywords: ["unordered"] },
  { action: "orderedList", label: "Numbered list", keywords: ["ordered"] },
  { action: "taskList", label: "Task list", keywords: ["checklist", "todo"] },
  { action: "quote", label: "Quote", keywords: ["blockquote"] },
  { action: "codeBlock", label: "Code block", keywords: ["snippet", "fence"] },
  { action: "link", label: "Link", keywords: ["url", "hyperlink"] },
  { action: "table", label: "Table", keywords: ["grid"] },
  { action: "image", label: "Image", keywords: ["picture", "photo"] },
];

/**
 * The commands the palette lists, built from the current app state. Pure so it can be tested
 * without rendering: the palette component only filters and runs what this returns.
 * Commands that need an open document are left out when there is none.
 */
export function buildPaletteCommands({
  modifier,
  hasActiveDocument,
  viewMode,
  showOutline,
  handlers,
}: PaletteContext): PaletteCommand[] {
  const commands: PaletteCommand[] = [
    { id: "file.new", label: "New document", group: "File", shortcut: `${modifier}+N`, keywords: ["create", "blank"], run: handlers.onNew },
    { id: "file.open", label: "Open file", group: "File", shortcut: `${modifier}+O`, keywords: ["import"], run: handlers.onOpen },
  ];

  if (hasActiveDocument) {
    commands.push(
      { id: "file.save", label: "Save", group: "File", shortcut: `${modifier}+S`, keywords: ["download"], run: handlers.onSave },
      { id: "file.save-as", label: "Save as", group: "File", shortcut: `${modifier}+Shift+S`, run: handlers.onSaveAs },
      { id: "file.export-html", label: "Export as HTML", group: "File", keywords: ["share", "publish"], run: handlers.onExportHtml },
      { id: "file.export-pdf", label: "Export as PDF", group: "File", keywords: ["print"], run: handlers.onExportPdf },
      { id: "file.close", label: "Close tab", group: "File", keywords: ["close document"], run: handlers.onCloseTab },
      { id: "edit.find", label: "Find", group: "Edit", shortcut: `${modifier}+F`, keywords: ["search"], run: () => handlers.onEditAction("find") },
      { id: "edit.replace", label: "Find and replace", group: "Edit", shortcut: `${modifier}+H`, keywords: ["substitute"], run: () => handlers.onEditAction("replace") },
      ...FORMAT_COMMANDS.map(({ action, label, keywords }) => ({
        id: `format.${action === "strike" ? "strikethrough" : action}`,
        label,
        group: "Format" as const,
        keywords,
        run: () => handlers.onFormat(action),
      })),
      ...VIEW_MODES.filter(({ mode }) => mode !== viewMode).map(({ mode, label, keywords }) => ({
        id: `view.mode.${mode}`,
        label,
        group: "View" as const,
        keywords,
        run: () => handlers.onViewModeChange(mode),
      })),
      {
        id: "view.outline",
        label: showOutline ? "Hide outline" : "Show outline",
        group: "View",
        keywords: ["headings", "table of contents", "toc"],
        run: handlers.onToggleOutline,
      },
    );
  }

  commands.push(
    { id: "view.theme", label: "Toggle light/dark theme", group: "View", keywords: ["appearance", "dark mode", "light mode"], run: handlers.onToggleTheme },
    { id: "app.settings", label: "Open settings", group: "App", keywords: ["preferences", "options"], run: handlers.onOpenSettings },
    { id: "help.shortcuts", label: "Keyboard shortcuts", group: "Help", keywords: ["keys", "hotkeys"], run: handlers.onOpenShortcuts },
    { id: "help.release-notes", label: "Release notes", group: "Help", keywords: ["changelog", "what's new"], run: handlers.onOpenReleaseNotes },
    { id: "help.about", label: "About Markora", group: "Help", keywords: ["version"], run: handlers.onOpenAbout },
  );

  return commands;
}

/** 1 for a prefix, 0.8 for a word start, 0.6 for anywhere inside; 0 for no match. */
function scoreText(query: string, text: string): number {
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return 0;
  if (index === 0) return 1;
  return /[^a-z0-9]/i.test(text[index - 1]) ? 0.8 : 0.6;
}

/**
 * How well a command matches what was typed: 0 means hide it, higher sorts first.
 * Deliberately not fuzzy: a fuzzy match on scattered letters ("bold" matching "Close tab") could put
 * a destructive command under the Enter key. The label is searched as a phrase, then the keywords at
 * half weight, so "strong" finds Bold but never outranks a label match.
 */
export function scorePaletteCommand(search: string, label: string, keywords: string[] = []): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;

  const labelScore = scoreText(query, label);
  const keywordScore = Math.max(0, ...keywords.map((keyword) => scoreText(query, keyword) * 0.5));
  return Math.max(labelScore, keywordScore);
}
