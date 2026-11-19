import type { EditorEditAction } from "../editor/editor-command-state";
import type { MarkdownToolbarAction } from "../editor/markdown-toolbar-actions";
import type { WorkspaceViewMode } from "../workspace/workspace-state";

export type PaletteGroup = "File" | "Edit" | "Format" | "View" | "App" | "Help";

/** A command the app offers, from the menus and the palette alike. */
export interface AppCommand {
  id: string;
  /** The menu wording; the palette shows the same text. */
  label: string;
  group: PaletteGroup;
  /** Shown beside the command, e.g. "Ctrl+S". Only set when a real shortcut exists. */
  shortcut?: string;
  /** Extra words the search also matches, e.g. "bold" for "Bold" is already in the label, "strong" is not. */
  keywords?: string[];
  /** False when the command needs something that is not there yet (an open document). Menus grey it out; the palette hides it. */
  enabled: boolean;
  /** Set for commands that are on or off, or one of a set (the active view mode); menus show a check. */
  checked?: boolean;
  run: () => void;
}

export type PaletteCommand = AppCommand;

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
  { mode: "live", label: "Live View", keywords: ["hybrid", "wysiwyg", "write", "rendered"] },
  { mode: "edit", label: "Edit View", keywords: ["edit", "write", "focus"] },
  { mode: "split", label: "Split View", keywords: ["side by side", "live preview"] },
  { mode: "preview", label: "Preview View", keywords: ["read", "rendered"] },
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
 * Every command the app offers, built from the current app state. Pure so it can be tested
 * without rendering: the menus and the palette only lay out and run what this returns.
 * Commands that need an open document are present but disabled when there is none.
 */
export function buildAppCommands({
  modifier,
  hasActiveDocument,
  viewMode,
  showOutline,
  handlers,
}: PaletteContext): AppCommand[] {
  const always = (command: Omit<AppCommand, "enabled">): AppCommand => ({ ...command, enabled: true });
  const withDocument = (command: Omit<AppCommand, "enabled">): AppCommand => ({ ...command, enabled: hasActiveDocument });
  const edit = (id: string, label: string, action: EditorEditAction, shortcut?: string, keywords?: string[]) =>
    withDocument({ id, label, group: "Edit", shortcut, keywords, run: () => handlers.onEditAction(action) });

  return [
    always({ id: "file.new", label: "New", group: "File", shortcut: `${modifier}+N`, keywords: ["create", "blank", "document"], run: handlers.onNew }),
    always({ id: "file.open", label: "Open", group: "File", shortcut: `${modifier}+O`, keywords: ["import", "file"], run: handlers.onOpen }),
    withDocument({ id: "file.save", label: "Save", group: "File", shortcut: `${modifier}+S`, keywords: ["download"], run: handlers.onSave }),
    withDocument({ id: "file.save-as", label: "Save As", group: "File", shortcut: `${modifier}+Shift+S`, run: handlers.onSaveAs }),
    withDocument({ id: "file.export-html", label: "Export as HTML", group: "File", keywords: ["share", "publish"], run: handlers.onExportHtml }),
    withDocument({ id: "file.export-pdf", label: "Export as PDF", group: "File", keywords: ["print"], run: handlers.onExportPdf }),
    withDocument({ id: "file.close", label: "Close Tab", group: "File", keywords: ["close document"], run: handlers.onCloseTab }),
    always({ id: "app.settings", label: "Settings", group: "App", keywords: ["preferences", "options"], run: handlers.onOpenSettings }),

    edit("edit.undo", "Undo", "undo", `${modifier}+Z`),
    edit("edit.redo", "Redo", "redo", `${modifier}+Shift+Z`),
    edit("edit.cut", "Cut", "cut", `${modifier}+X`),
    edit("edit.copy", "Copy", "copy", `${modifier}+C`),
    edit("edit.paste", "Paste", "paste", `${modifier}+V`),
    edit("edit.select-all", "Select All", "selectAll", `${modifier}+A`),
    edit("edit.find", "Find", "find", `${modifier}+F`, ["search"]),
    edit("edit.replace", "Replace", "replace", `${modifier}+H`, ["substitute", "find and replace"]),

    ...FORMAT_COMMANDS.map(({ action, label, keywords }) =>
      withDocument({
        id: `format.${action === "strike" ? "strikethrough" : action}`,
        label,
        group: "Format",
        keywords,
        run: () => handlers.onFormat(action),
      }),
    ),

    ...VIEW_MODES.map(({ mode, label, keywords }) => ({
      ...withDocument({ id: `view.mode.${mode}`, label, group: "View", keywords, run: () => handlers.onViewModeChange(mode) }),
      checked: mode === viewMode,
    })),
    {
      ...withDocument({
        id: "view.outline",
        label: "Outline",
        group: "View",
        keywords: ["headings", "table of contents", "toc"],
        run: handlers.onToggleOutline,
      }),
      checked: showOutline,
    },
    always({ id: "view.theme", label: "Toggle Light/Dark Theme", group: "View", keywords: ["appearance", "dark mode", "light mode"], run: handlers.onToggleTheme }),

    always({ id: "help.shortcuts", label: "Keyboard Shortcuts", group: "Help", keywords: ["keys", "hotkeys"], run: handlers.onOpenShortcuts }),
    always({ id: "help.release-notes", label: "Release Notes", group: "Help", keywords: ["changelog", "what's new"], run: handlers.onOpenReleaseNotes }),
    always({ id: "help.about", label: "About Markora", group: "Help", keywords: ["version"], run: handlers.onOpenAbout }),
  ];
}

/**
 * The commands the palette lists: everything that can run now, minus the view mode the user is
 * already in, with the outline worded for what selecting it will do.
 */
export function buildPaletteCommands(context: PaletteContext): PaletteCommand[] {
  return buildAppCommands(context)
    .filter((command) => command.enabled)
    .filter((command) => !(command.id.startsWith("view.mode.") && command.checked))
    .map((command) =>
      command.id === "view.outline" ? { ...command, label: context.showOutline ? "Hide Outline" : "Show Outline" } : command,
    );
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
