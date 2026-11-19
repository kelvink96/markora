import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../settings/settings-schema";
import { buildAppCommands, buildPaletteCommands, scorePaletteCommand, type PaletteContext } from "./palette-commands";

function context(overrides: Partial<PaletteContext> = {}): PaletteContext {
  return {
    modifier: "Ctrl",
    hasActiveDocument: true,
    viewMode: "split",
    showOutline: false,
    appearance: { ...defaultSettings.appearance },
    editor: { ...defaultSettings.editor },
    updatesSupported: true,
    handlers: {
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onSaveAs: vi.fn(),
      onCloseTab: vi.fn(),
      onExportHtml: vi.fn(),
      onExportPdf: vi.fn(),
      onOpenSettings: vi.fn(),
      onToggleTheme: vi.fn(),
      onToggleOutline: vi.fn(),
      onViewModeChange: vi.fn(),
      onFormat: vi.fn(),
      onEditAction: vi.fn(),
      onOpenShortcuts: vi.fn(),
      onOpenReleaseNotes: vi.fn(),
      onOpenAbout: vi.fn(),
      onToggleStatusBar: vi.fn(),
      onToggleWordWrap: vi.fn(),
      onToggleLineNumbers: vi.fn(),
      onSetThemePreference: vi.fn(),
      onSetColorScheme: vi.fn(),
      onZoom: vi.fn(),
      onOpenCommandPalette: vi.fn(),
      onOpenDocs: vi.fn(),
      onReportIssue: vi.fn(),
      onTakeTour: vi.fn(),
      onCheckForUpdates: vi.fn(),
    },
    ...overrides,
  };
}

const find = (commands: ReturnType<typeof buildPaletteCommands>, id: string) => commands.find((command) => command.id === id);

describe("buildPaletteCommands", () => {
  it("only offers commands that make sense without an open document", () => {
    const ids = buildPaletteCommands(context({ hasActiveDocument: false })).map((command) => command.id);

    expect(ids).toEqual(expect.arrayContaining(["file.new", "file.open", "app.settings", "view.theme", "help.shortcuts"]));
    for (const unavailable of ["file.save", "file.export-html", "format.bold", "edit.find", "view.mode.split", "view.outline"]) {
      expect(ids).not.toContain(unavailable);
    }
  });

  it("offers document commands once a document is open", () => {
    const ids = buildPaletteCommands(context()).map((command) => command.id);

    expect(ids).toEqual(
      expect.arrayContaining(["file.save", "file.save-as", "file.export-html", "file.export-pdf", "format.bold", "edit.find", "view.outline"]),
    );
  });

  it("shows the real shortcut for each command, using this machine's modifier", () => {
    const commands = buildPaletteCommands(context({ modifier: "Cmd" }));

    expect(find(commands, "file.new")?.shortcut).toBe("Cmd+N");
    expect(find(commands, "file.save-as")?.shortcut).toBe("Cmd+Shift+S");
    expect(find(commands, "edit.find")?.shortcut).toBe("Cmd+F");
    expect(find(commands, "edit.replace")?.shortcut).toBe("Cmd+H");
  });

  it("runs the matching handler with the right argument", () => {
    const ctx = context();
    const commands = buildPaletteCommands(ctx);

    find(commands, "view.mode.preview")?.run();
    find(commands, "format.bold")?.run();
    find(commands, "edit.replace")?.run();
    find(commands, "file.save")?.run();

    expect(ctx.handlers.onViewModeChange).toHaveBeenCalledWith("preview");
    expect(ctx.handlers.onFormat).toHaveBeenCalledWith("bold");
    expect(ctx.handlers.onEditAction).toHaveBeenCalledWith("replace");
    expect(ctx.handlers.onSave).toHaveBeenCalledTimes(1);
  });

  it("does not offer the view mode the user is already in", () => {
    const ids = buildPaletteCommands(context({ viewMode: "split" })).map((command) => command.id);

    expect(ids).not.toContain("view.mode.split");
    expect(ids).toEqual(expect.arrayContaining(["view.mode.live", "view.mode.edit", "view.mode.preview"]));
  });

  it("words the outline command for its current state", () => {
    expect(find(buildPaletteCommands(context({ showOutline: false })), "view.outline")?.label).toBe("Show Outline");
    expect(find(buildPaletteCommands(context({ showOutline: true })), "view.outline")?.label).toBe("Hide Outline");
  });

  it("gives every command a unique id and a group", () => {
    const commands = buildPaletteCommands(context());
    const ids = commands.map((command) => command.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(commands.every((command) => command.group.length > 0)).toBe(true);
  });
});

describe("buildAppCommands", () => {
  const byId = (id: string, ctx = context()) => buildAppCommands(ctx).find((command) => command.id === id);

  it("lists document commands as disabled, not missing, when nothing is open", () => {
    const ctx = context({ hasActiveDocument: false });

    expect(byId("file.save", ctx)?.enabled).toBe(false);
    expect(byId("format.bold", ctx)?.enabled).toBe(false);
    expect(byId("edit.undo", ctx)?.enabled).toBe(false);
    expect(byId("file.new", ctx)?.enabled).toBe(true);
    expect(byId("app.settings", ctx)?.enabled).toBe(true);
  });

  it("enables document commands once a document is open", () => {
    expect(byId("file.save")?.enabled).toBe(true);
    expect(byId("view.outline")?.enabled).toBe(true);
  });

  it("marks the active view mode and the open outline as checked", () => {
    expect(byId("view.mode.split")?.checked).toBe(true);
    expect(byId("view.mode.live")?.checked).toBe(false);
    expect(byId("view.outline", context({ showOutline: true }))?.checked).toBe(true);
    expect(byId("view.outline")?.checked).toBe(false);
  });

  it("uses one label for the outline command whatever its state", () => {
    expect(byId("view.outline", context({ showOutline: true }))?.label).toBe("Outline");
    expect(byId("view.outline")?.label).toBe("Outline");
  });

  it("offers Undo, Redo, Cut, Copy, Paste and Select All with their shortcuts", () => {
    const ctx = context({ modifier: "Cmd" });
    const expected: Array<[string, string, string]> = [
      ["edit.undo", "Undo", "Cmd+Z"],
      ["edit.redo", "Redo", "Cmd+Shift+Z"],
      ["edit.cut", "Cut", "Cmd+X"],
      ["edit.copy", "Copy", "Cmd+C"],
      ["edit.paste", "Paste", "Cmd+V"],
      ["edit.select-all", "Select All", "Cmd+A"],
    ];

    for (const [id, label, shortcut] of expected) {
      expect(byId(id, ctx)).toMatchObject({ label, shortcut, group: "Edit", enabled: true });
    }
  });

  it("runs the edit action for each Edit command", () => {
    const ctx = context();

    byId("edit.undo", ctx)?.run();
    byId("edit.select-all", ctx)?.run();

    expect(ctx.handlers.onEditAction).toHaveBeenNthCalledWith(1, "undo");
    expect(ctx.handlers.onEditAction).toHaveBeenNthCalledWith(2, "selectAll");
  });

  it("words commands the same way the menus do", () => {
    const labels = Object.fromEntries(buildAppCommands(context()).map((command) => [command.id, command.label]));

    expect(labels).toMatchObject({
      "file.new": "New",
      "file.open": "Open",
      "file.save-as": "Save As",
      "file.close": "Close Tab",
      "app.settings": "Settings",
      "edit.find": "Find",
      "edit.replace": "Replace",
      "view.mode.live": "Live View",
      "view.mode.edit": "Edit View",
      "view.mode.split": "Split View",
      "view.mode.preview": "Preview View",
    });
  });
});

describe("view, theme, zoom and help commands", () => {
  const byId = (id: string, ctx = context()) => buildAppCommands(ctx).find((command) => command.id === id);

  it("checks only the Theme option that matches the stored preference, not the resolved theme", () => {
    const ctx = context({ appearance: { ...defaultSettings.appearance, theme: "system" } });

    expect(byId("view.theme.system", ctx)?.checked).toBe(true);
    expect(byId("view.theme.light", ctx)?.checked).toBe(false);
    expect(byId("view.theme.dark", ctx)?.checked).toBe(false);
  });

  it("sets the theme preference and colour scheme it is named after", () => {
    const ctx = context();

    byId("view.theme.dark", ctx)?.run();
    byId("view.color-scheme.high-contrast", ctx)?.run();

    expect(ctx.handlers.onSetThemePreference).toHaveBeenCalledWith("dark");
    expect(ctx.handlers.onSetColorScheme).toHaveBeenCalledWith("high-contrast");
  });

  it("checks the current colour scheme and labels the options for the palette", () => {
    const ctx = context({ appearance: { ...defaultSettings.appearance, colorScheme: "sepia" } });

    expect(byId("view.color-scheme.sepia", ctx)).toMatchObject({ checked: true, label: "Color Scheme: Sepia" });
    expect(byId("view.color-scheme.standard", ctx)?.checked).toBe(false);
    expect(byId("view.theme.light", ctx)?.label).toBe("Theme: Light");
  });

  it("mirrors the status bar, word wrap and line number settings as checks", () => {
    const ctx = context({
      appearance: { ...defaultSettings.appearance, showStatusBar: false },
      editor: { ...defaultSettings.editor, wordWrap: true, lineNumbers: false },
    });

    expect(byId("view.status-bar", ctx)?.checked).toBe(false);
    expect(byId("view.word-wrap", ctx)?.checked).toBe(true);
    expect(byId("view.line-numbers", ctx)?.checked).toBe(false);
  });

  it("runs the toggle handlers", () => {
    const ctx = context();

    byId("view.status-bar", ctx)?.run();
    byId("view.word-wrap", ctx)?.run();
    byId("view.line-numbers", ctx)?.run();

    expect(ctx.handlers.onToggleStatusBar).toHaveBeenCalledTimes(1);
    expect(ctx.handlers.onToggleWordWrap).toHaveBeenCalledTimes(1);
    expect(ctx.handlers.onToggleLineNumbers).toHaveBeenCalledTimes(1);
  });

  it("disables Zoom In at the top of the range and Reset Zoom at the defaults", () => {
    const top = context({ appearance: { ...defaultSettings.appearance, editorFontSize: 24, previewFontScale: 1.5 } });

    expect(byId("view.zoom-in", top)?.enabled).toBe(false);
    expect(byId("view.zoom-out", top)?.enabled).toBe(true);
    expect(byId("view.zoom-reset")?.enabled).toBe(false);
    expect(byId("view.zoom-in")?.enabled).toBe(true);
  });

  it("runs the zoom handler with its direction", () => {
    const ctx = context();

    byId("view.zoom-in", ctx)?.run();
    byId("view.zoom-out", ctx)?.run();
    byId("view.zoom-reset", ctx)?.run();

    expect(ctx.handlers.onZoom).toHaveBeenNthCalledWith(1, "in");
    expect(ctx.handlers.onZoom).toHaveBeenNthCalledWith(2, "out");
    expect(ctx.handlers.onZoom).toHaveBeenNthCalledWith(3, "reset");
  });

  it("keeps theme, zoom and help available with no document while view toggles wait for one", () => {
    const ctx = context({ hasActiveDocument: false });

    for (const id of ["view.theme.dark", "view.color-scheme.sepia", "view.zoom-in", "help.docs", "help.report-issue", "help.tour", "app.palette"]) {
      expect(byId(id, ctx)?.enabled).toBe(true);
    }
    for (const id of ["view.status-bar", "view.word-wrap", "view.line-numbers"]) {
      expect(byId(id, ctx)?.enabled).toBe(false);
    }
  });

  it("offers Command Palette from the menus but not from inside the palette itself", () => {
    const ctx = context();

    expect(byId("app.palette", ctx)).toMatchObject({ label: "Command Palette", shortcut: "Ctrl+K", group: "Help" });
    expect(buildPaletteCommands(ctx).map((command) => command.id)).not.toContain("app.palette");
  });

  it("runs the help handlers", () => {
    const ctx = context();

    byId("help.docs", ctx)?.run();
    byId("help.report-issue", ctx)?.run();
    byId("app.palette", ctx)?.run();
    byId("help.tour", ctx)?.run();

    expect(ctx.handlers.onTakeTour).toHaveBeenCalledTimes(1);
    expect(ctx.handlers.onOpenDocs).toHaveBeenCalledTimes(1);
    expect(ctx.handlers.onReportIssue).toHaveBeenCalledTimes(1);
    expect(ctx.handlers.onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });
});

describe("scorePaletteCommand", () => {
  it("matches everything when there is no search", () => {
    expect(scorePaletteCommand("", "Bold", [])).toBeGreaterThan(0);
  });

  it("never matches letters scattered across the words (no fuzzy matching)", () => {
    // "bold" must not pull in "Close tab" via the b of tab, the o and l of close and the d of document.
    expect(scorePaletteCommand("bold", "Close tab", ["close document"])).toBe(0);
    expect(scorePaletteCommand("bold", "Bold", ["strong"])).toBeGreaterThan(0);
  });

  it("ranks a label that starts with the search above a word match above a keyword match", () => {
    const prefix = scorePaletteCommand("sav", "Save as", []);
    const wordStart = scorePaletteCommand("sav", "Quick save", []);
    const keyword = scorePaletteCommand("sav", "Download", ["save"]);

    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(keyword);
    expect(keyword).toBeGreaterThan(0);
  });

  it("is case-insensitive and finds keywords", () => {
    expect(scorePaletteCommand("DARK", "Toggle light/dark theme", [])).toBeGreaterThan(0);
    expect(scorePaletteCommand("strong", "Bold", ["strong"])).toBeGreaterThan(0);
  });

  it("matches multi-word searches as a phrase", () => {
    expect(scorePaletteCommand("save as", "Save as", [])).toBeGreaterThan(0);
    expect(scorePaletteCommand("as save", "Save as", [])).toBe(0);
  });
});

describe("Check for updates", () => {
  it("is offered in the palette when updates are supported, and runs the handler", () => {
    const ctx = context({ updatesSupported: true });
    const command = find(buildPaletteCommands(ctx), "help.check-for-updates");

    expect(command).toMatchObject({ label: "Check for updates", group: "App" });
    command?.run();
    expect(ctx.handlers.onCheckForUpdates).toHaveBeenCalledTimes(1);
  });

  it("is hidden from the palette when updates are not supported", () => {
    expect(find(buildPaletteCommands(context({ updatesSupported: false })), "help.check-for-updates")).toBeUndefined();
  });
});
