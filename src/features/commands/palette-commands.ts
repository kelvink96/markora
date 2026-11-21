import type { EditorEditAction } from "../editor/editor-command-state";
import type { MarkdownToolbarAction } from "../editor/markdown-toolbar-actions";
import { COLOR_SCHEMES } from "../settings/color-schemes";
import type { AppearanceSettings, ColorScheme, EditorSettings, ThemePreference } from "../settings/settings-schema";
import type { UpdateStatus } from "../updates/update-store";
import { canZoom, type ZoomDirection } from "../settings/zoom";
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
  /** Key into the menu icon table when the icon is not simply the command id (it changes with state). */
  icon?: string;
  /** A small tag beside the label, e.g. "New". */
  badge?: string;
  /** Work is in progress: menus show the icon spinning. */
  busy?: boolean;
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
  onToggleSyntax: () => void;
  onToggleFocus: () => void;
  onFormat: (action: MarkdownToolbarAction) => void;
  onEditAction: (action: EditorEditAction) => void;
  onOpenShortcuts: () => void;
  onOpenReleaseNotes: () => void;
  onOpenAbout: () => void;
  onToggleStatusBar: () => void;
  onToggleWordWrap: () => void;
  onToggleLineNumbers: () => void;
  onSetThemePreference: (preference: ThemePreference) => void;
  onSetColorScheme: (scheme: ColorScheme) => void;
  onZoom: (direction: ZoomDirection) => void;
  onOpenCommandPalette: () => void;
  onOpenDocs: () => void;
  onReportIssue: () => void;
  onStarOnGitHub: () => void;
  onOpenReleases: () => void;
  onTakeTour: () => void;
  onCheckForUpdates: () => void;
}

export interface PaletteContext {
  /** "Ctrl" or "Cmd", from getModifierLabel(). */
  modifier: string;
  hasActiveDocument: boolean;
  viewMode: WorkspaceViewMode;
  /** Whether Write shows raw markdown instead of rendering it inline. */
  showSyntax: boolean;
  /** Whether Focus (chrome hidden, other paragraphs dimmed) is on. */
  focusMode: boolean;
  showOutline: boolean;
  /** The stored appearance settings: the theme preference (not the resolved theme), colour scheme, zoom and status bar. */
  appearance: AppearanceSettings;
  editor: EditorSettings;
  /** False where the app cannot update itself (the web build); the command is then not offered. */
  updatesSupported: boolean;
  /** Where the in-app update is, so the update command can say what a click will do. Defaults to idle. */
  update?: { status: UpdateStatus; version: string | null };
  handlers: PaletteHandlers;
}

const VIEW_MODES: Array<{ mode: WorkspaceViewMode; label: string; keywords: string[] }> = [
  { mode: "write", label: "Write View", keywords: ["live", "hybrid", "wysiwyg", "rendered", "edit"] },
  { mode: "split", label: "Side-by-side View", keywords: ["split", "side by side", "live preview"] },
  { mode: "read", label: "Read View", keywords: ["preview", "reading", "rendered"] },
];

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; keywords: string[] }> = [
  { value: "system", label: "System", keywords: ["automatic", "follow system"] },
  { value: "light", label: "Light", keywords: ["light mode", "bright"] },
  { value: "dark", label: "Dark", keywords: ["dark mode"] },
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

/** The wording, icon and tags of the update command for the current update state. */
function updateEntry({ status, version }: NonNullable<PaletteContext["update"]>): Pick<AppCommand, "label" | "icon" | "badge" | "busy"> {
  const name = version ?? "";
  switch (status) {
    case "available":
      return { label: `Update available: ${name}`, icon: "help.update-available", badge: "New" };
    case "downloading":
      return { label: `Downloading ${name}…`, icon: "help.update-downloading", busy: true };
    case "ready":
      return { label: `Restart to update to ${name}`, icon: "help.update-restart" };
    default:
      return { label: "Check for updates", icon: "help.check-for-updates" };
  }
}

/**
 * Every command the app offers, built from the current app state. Pure so it can be tested
 * without rendering: the menus and the palette only lay out and run what this returns.
 * Commands that need an open document are present but disabled when there is none.
 */
export function buildAppCommands({
  modifier,
  hasActiveDocument,
  viewMode,
  showSyntax,
  focusMode,
  showOutline,
  appearance,
  editor,
  updatesSupported,
  update = { status: "idle", version: null },
  handlers,
}: PaletteContext): AppCommand[] {
  const always = (command: Omit<AppCommand, "enabled">): AppCommand => ({ ...command, enabled: true });
  const withDocument = (command: Omit<AppCommand, "enabled">): AppCommand => ({ ...command, enabled: hasActiveDocument });
  // Read hides the editor, so its editing and formatting commands would change the document out of sight.
  const withEditor = (command: Omit<AppCommand, "enabled">): AppCommand => ({ ...command, enabled: hasActiveDocument && viewMode !== "read" });
  const edit = (id: string, label: string, action: EditorEditAction, shortcut?: string, keywords?: string[]) =>
    withEditor({ id, label, group: "Edit", shortcut, keywords, run: () => handlers.onEditAction(action) });

  return [
    always({ id: "file.new", label: "New", group: "File", shortcut: `${modifier}+N`, keywords: ["create", "blank", "document"], run: handlers.onNew }),
    always({ id: "file.open", label: "Open", group: "File", shortcut: `${modifier}+O`, keywords: ["import", "file"], run: handlers.onOpen }),
    withDocument({ id: "file.save", label: "Save", group: "File", shortcut: `${modifier}+S`, keywords: ["download"], run: handlers.onSave }),
    withDocument({ id: "file.save-as", label: "Save As", group: "File", shortcut: `${modifier}+Shift+S`, run: handlers.onSaveAs }),
    withDocument({ id: "file.export-html", label: "Export as HTML", group: "File", keywords: ["share", "publish"], run: handlers.onExportHtml }),
    withDocument({ id: "file.export-pdf", label: "Export as PDF", group: "File", keywords: ["print"], run: handlers.onExportPdf }),
    withDocument({ id: "file.close", label: "Close Tab", group: "File", keywords: ["close document"], run: handlers.onCloseTab }),
    always({ id: "app.settings", label: "Settings", group: "App", keywords: ["preferences", "options"], run: handlers.onOpenSettings }),
    { ...always({ id: "help.check-for-updates", group: "App", keywords: ["update", "upgrade", "new version", "latest"], run: handlers.onCheckForUpdates, ...updateEntry(update) }), enabled: updatesSupported && update.status !== "downloading" },

    edit("edit.undo", "Undo", "undo", `${modifier}+Z`),
    edit("edit.redo", "Redo", "redo", `${modifier}+Shift+Z`),
    edit("edit.cut", "Cut", "cut", `${modifier}+X`),
    edit("edit.copy", "Copy", "copy", `${modifier}+C`),
    edit("edit.paste", "Paste", "paste", `${modifier}+V`),
    edit("edit.select-all", "Select All", "selectAll", `${modifier}+A`),
    edit("edit.find", "Find", "find", `${modifier}+F`, ["search"]),
    edit("edit.replace", "Replace", "replace", `${modifier}+H`, ["substitute", "find and replace"]),

    ...FORMAT_COMMANDS.map(({ action, label, keywords }) =>
      withEditor({
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
      ...withDocument({ id: "view.syntax", label: "Show Syntax", group: "View", keywords: ["markdown", "raw", "source", "markers", "rendered"], run: handlers.onToggleSyntax }),
      // Show syntax only changes the Write view, so there is nothing to toggle elsewhere.
      enabled: hasActiveDocument && viewMode === "write",
      checked: showSyntax,
    },
    {
      ...withDocument({ id: "view.focus", label: "Focus", group: "View", shortcut: `${modifier}+Shift+F`, keywords: ["distraction", "zen", "hide", "full screen", "dim"], run: handlers.onToggleFocus }),
      // Focus belongs to Write, so there is nothing to focus in the other views.
      enabled: hasActiveDocument && viewMode === "write",
      checked: focusMode,
    },
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
    { ...withDocument({ id: "view.status-bar", label: "Status Bar", group: "View", keywords: ["footer", "word count"], run: handlers.onToggleStatusBar }), checked: appearance.showStatusBar },
    always({ id: "view.theme", label: "Toggle Light/Dark Theme", group: "View", keywords: ["appearance", "dark mode", "light mode"], run: handlers.onToggleTheme }),
    ...THEME_OPTIONS.map(({ value, label, keywords }) => ({
      ...always({ id: `view.theme.${value}`, label: `Theme: ${label}`, group: "View" as const, keywords: ["appearance", ...keywords], run: () => handlers.onSetThemePreference(value) }),
      checked: appearance.theme === value,
    })),
    ...COLOR_SCHEMES.map(({ id, name, keywords }) => ({
      ...always({ id: `view.color-scheme.${id}`, label: `Color Scheme: ${name}`, group: "View" as const, keywords: ["appearance", "colour", ...keywords], run: () => handlers.onSetColorScheme(id) }),
      checked: appearance.colorScheme === id,
    })),
    { ...withDocument({ id: "view.word-wrap", label: "Word Wrap", group: "View", keywords: ["wrap long lines"], run: handlers.onToggleWordWrap }), checked: editor.wordWrap },
    { ...withDocument({ id: "view.line-numbers", label: "Line Numbers", group: "View", keywords: ["gutter"], run: handlers.onToggleLineNumbers }), checked: editor.lineNumbers },
    { ...always({ id: "view.zoom-in", label: "Zoom In", group: "View", keywords: ["bigger", "larger", "text size"], run: () => handlers.onZoom("in") }), enabled: canZoom(appearance, "in") },
    { ...always({ id: "view.zoom-out", label: "Zoom Out", group: "View", keywords: ["smaller", "text size"], run: () => handlers.onZoom("out") }), enabled: canZoom(appearance, "out") },
    { ...always({ id: "view.zoom-reset", label: "Reset Zoom", group: "View", keywords: ["actual size", "default size"], run: () => handlers.onZoom("reset") }), enabled: canZoom(appearance, "reset") },

    always({ id: "app.palette", label: "Command Palette", group: "Help", shortcut: `${modifier}+K`, keywords: ["commands", "search"], run: handlers.onOpenCommandPalette }),
    always({ id: "help.tour", label: "Take the tour", group: "Help", keywords: ["onboarding", "walkthrough", "guide", "intro", "welcome"], run: handlers.onTakeTour }),
    always({ id: "help.shortcuts", label: "Keyboard Shortcuts", group: "Help", keywords: ["keys", "hotkeys"], run: handlers.onOpenShortcuts }),
    always({ id: "help.release-notes", label: "Release Notes", group: "Help", keywords: ["changelog", "what's new"], run: handlers.onOpenReleaseNotes }),
    always({ id: "help.docs", label: "Documentation", group: "Help", keywords: ["docs", "guide", "readme"], run: handlers.onOpenDocs }),
    always({ id: "help.report-issue", label: "Report an Issue", group: "Help", keywords: ["bug", "feedback", "github"], run: handlers.onReportIssue }),
    always({ id: "help.star", label: "Star on GitHub", group: "Help", keywords: ["github", "repo", "repository", "support", "like"], run: handlers.onStarOnGitHub }),
    always({ id: "help.releases", label: "View Releases", group: "Help", keywords: ["github", "download", "changelog", "versions"], run: handlers.onOpenReleases }),
    always({ id: "help.about", label: "About Markora", group: "Help", keywords: ["version"], run: handlers.onOpenAbout }),
  ];
}

/**
 * The commands the palette lists: everything that can run now, minus the view mode the user is
 * already in, with the outline worded for what selecting it will do.
 */
export function buildPaletteCommands(context: PaletteContext): PaletteCommand[] {
  return buildAppCommands(context)
    .filter((command) => command.enabled && command.id !== "app.palette")
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
