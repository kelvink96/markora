import { describe, expect, it, vi } from "vitest";
import { buildPaletteCommands, scorePaletteCommand, type PaletteContext } from "./palette-commands";

function context(overrides: Partial<PaletteContext> = {}): PaletteContext {
  return {
    modifier: "Ctrl",
    hasActiveDocument: true,
    viewMode: "split",
    showOutline: false,
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
    expect(ids).toEqual(expect.arrayContaining(["view.mode.edit", "view.mode.preview"]));
  });

  it("words the outline command for its current state", () => {
    expect(find(buildPaletteCommands(context({ showOutline: false })), "view.outline")?.label).toBe("Show outline");
    expect(find(buildPaletteCommands(context({ showOutline: true })), "view.outline")?.label).toBe("Hide outline");
  });

  it("gives every command a unique id and a group", () => {
    const commands = buildPaletteCommands(context());
    const ids = commands.map((command) => command.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(commands.every((command) => command.group.length > 0)).toBe(true);
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
