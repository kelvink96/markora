import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";
import { buildAppCommands, type PaletteContext, type PaletteHandlers } from "../../../features/commands/palette-commands";
import { defaultSettings } from "../../../features/settings/settings-schema";
import { useDocumentStore } from "../../../store/document";
import { useThemeStore } from "../../../features/theme/theme-store";
import { useUpdateStore, type UpdateStatus } from "../../../features/updates/update-store";

/** Handlers that are created on first use, so a test can assert on any of them without listing all. */
function makeHandlers() {
  const created = new Map<string, Mock>();
  return new Proxy({}, {
    get: (_target, key: string) => {
      if (!created.has(key)) created.set(key, vi.fn());
      return created.get(key);
    },
  }) as PaletteHandlers;
}

type BarProps = Partial<Parameters<typeof TopBar>[0]>;

function renderBar({ context = {}, ...props }: BarProps & { context?: Partial<PaletteContext> } = {}) {
  const handlers = makeHandlers();
  const commandContext: PaletteContext = {
    modifier: "Ctrl",
    hasActiveDocument: Boolean(useDocumentStore.getState().activeDocumentId),
    viewMode: "split",
    showSyntax: false,
    focusMode: false,
    showOutline: false,
    appearance: { ...defaultSettings.appearance },
    editor: { ...defaultSettings.editor },
    updatesSupported: true,
    handlers,
    ...context,
  };
  const onThemeToggle = vi.fn();
  const onViewModeChange = vi.fn();
  render(
    <TopBar
      viewMode={commandContext.viewMode}
      commands={buildAppCommands(commandContext)}
      updatesSupported={commandContext.updatesSupported}
      onThemeToggle={onThemeToggle}
      onViewModeChange={onViewModeChange}
      {...props}
    />,
  );
  return { handlers, onThemeToggle, onViewModeChange };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("menuitem", { name }));
  return screen.findByRole("menu");
}

/** Picks a submenu item. jsdom does not deliver the pointer events Radix needs inside a submenu, so use the keyboard. */
async function choose(user: ReturnType<typeof userEvent.setup>, item: HTMLElement) {
  item.focus();
  await user.keyboard("{Enter}");
}

describe("TopBar", () => {
  beforeEach(() => {
    // Most controls only work while a document is open.
    useDocumentStore.setState({ activeDocumentId: "doc-1" });
    useThemeStore.setState({ resolvedTheme: "light" });
  });

  it("is the page banner with a menubar, a slot for tabs, and the utilities", () => {
    renderBar({ tabs: <div>The tabs</div> });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("menubar")).toBeInTheDocument();
    expect(screen.getByText("The tabs")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-menu")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
  });

  it("shows File, Edit, Format, View and Help while a document is open", () => {
    renderBar();
    for (const name of ["File", "Edit", "Format", "View", "Help"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
  });

  it("hides the menus with nothing to offer when nothing is open", () => {
    useDocumentStore.setState({ activeDocumentId: "" });
    renderBar();

    for (const name of ["File", "View", "Help"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
    for (const name of ["Edit", "Format"]) {
      expect(screen.queryByRole("menuitem", { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("radiogroup", { name: "View mode" })).not.toBeInTheDocument();
    expect(screen.queryByRole("toolbar", { name: "Formatting" })).not.toBeInTheDocument();
  });

  it("shows the wordmark only on the empty screen", () => {
    useDocumentStore.setState({ activeDocumentId: "" });
    const { unmount } = render(<TopBar viewMode="split" commands={[]} onViewModeChange={vi.fn()} />);
    expect(screen.getByText("Markora")).toBeInTheDocument();
    unmount();

    useDocumentStore.setState({ activeDocumentId: "doc-1" });
    render(<TopBar viewMode="split" commands={[]} onViewModeChange={vi.fn()} />);
    expect(screen.queryByText("Markora")).not.toBeInTheDocument();
  });

  it("shows the shortcut each command carries, such as Cmd on macOS", async () => {
    const user = userEvent.setup();
    renderBar({ context: { modifier: "Cmd" } });

    await openMenu(user, "File");

    expect(screen.getByText("Cmd+N")).toBeInTheDocument();
    expect(screen.getByText("Cmd+Shift+S")).toBeInTheDocument();
  });

  describe("File menu", () => {
    // Item names include their shortcut ("Open Ctrl+O"), and "Open" / "Save" are prefixes of
    // "Open Recent" / "Save As", so each is matched precisely.
    it.each([
      ["New", /^New\b/, "onNew"],
      ["Open", /^Open\b(?! Recent)/, "onOpen"],
      ["Save", /^Save\b(?! As)/, "onSave"],
      ["Save As", /^Save As\b/, "onSaveAs"],
      ["Close Tab", /^Close Tab/, "onCloseTab"],
      ["Settings", /^Settings/, "onOpenSettings"],
    ] as const)("%s calls %s", async (_label, name, handler) => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "File");
      await user.click(await screen.findByRole("menuitem", { name }));

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["HTML", "onExportHtml"],
      ["PDF", "onExportPdf"],
    ] as const)("exports as %s from the Export submenu", async (label, handler) => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "File");
      await user.click(await screen.findByRole("menuitem", { name: /Export/ }));
      await choose(user, await screen.findByRole("menuitem", { name: label }));

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    });

    it("greys out the document commands when nothing is open, and selecting one does nothing", async () => {
      const user = userEvent.setup();
      useDocumentStore.setState({ activeDocumentId: "" });
      const { handlers } = renderBar();

      const menu = await openMenu(user, "File");
      const save = within(menu).getByRole("menuitem", { name: /^Save\b(?! As)/ });

      expect(save).toHaveAttribute("aria-disabled", "true");
      expect(within(menu).getByRole("menuitem", { name: /^Close Tab/ })).toHaveAttribute("aria-disabled", "true");
      expect(within(menu).getByRole("menuitem", { name: /^New/ })).not.toHaveAttribute("aria-disabled", "true");
      expect(within(menu).getByRole("menuitem", { name: /^Settings/ })).not.toHaveAttribute("aria-disabled", "true");

      await user.click(save);
      expect(handlers.onSave).not.toHaveBeenCalled();
    });

    it("lists recent files in a submenu and opens the one picked", async () => {
      const user = userEvent.setup();
      const onOpenRecent = vi.fn();
      renderBar({
        onOpenRecent,
        recentFiles: [
          { documentId: "doc-1", projectId: "proj-1", title: "notes.md" },
          { documentId: "doc-2", projectId: "proj-1", title: "readme.md" },
        ],
      });

      await openMenu(user, "File");
      await user.click(await screen.findByRole("menuitem", { name: /Open Recent/ }));
      const readme = await screen.findByRole("menuitem", { name: "readme.md" });
      readme.focus();
      await user.keyboard("{Enter}");

      expect(onOpenRecent).toHaveBeenCalledWith("proj-1", "doc-2");
    });

    it("says so when there are no recent files", async () => {
      const user = userEvent.setup();
      renderBar({ recentFiles: [] });

      await openMenu(user, "File");
      await user.click(await screen.findByRole("menuitem", { name: /Open Recent/ }));

      expect(await screen.findByRole("menuitem", { name: "No recent files" })).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Edit menu", () => {
    it.each([
      ["Undo", "undo"],
      ["Redo", "redo"],
      ["Cut", "cut"],
      ["Copy", "copy"],
      ["Paste", "paste"],
      ["Select All", "selectAll"],
      ["Find", "find"],
      ["Replace", "replace"],
    ] as const)("%s runs the %s editor action", async (label, action) => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "Edit");
      await user.click(await screen.findByRole("menuitem", { name: new RegExp(`^${label}`) }));

      expect(handlers.onEditAction).toHaveBeenCalledWith(action);
    });

  });

  describe("Format menu", () => {
    it("applies a format from the menu", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "Format");
      await user.click(await screen.findByRole("menuitem", { name: "Bold" }));

      expect(handlers.onFormat).toHaveBeenCalledWith("bold");
    });

    it("keeps the list formats in a List submenu", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "Format");
      await user.click(await screen.findByRole("menuitem", { name: "List" }));
      await choose(user, await screen.findByRole("menuitem", { name: "Task list" }));

      expect(handlers.onFormat).toHaveBeenCalledWith("taskList");
    });

  });

  describe("View menu", () => {
    it("checks the active view mode and switches to another", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "View");
      await user.click(await screen.findByRole("menuitem", { name: "Mode" }));

      expect(await screen.findByRole("menuitemradio", { name: /Side-by-side View/ })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menuitemradio", { name: /Write View/ })).toHaveAttribute("aria-checked", "false");

      await choose(user, screen.getByRole("menuitemradio", { name: /Write View/ }));
      expect(handlers.onViewModeChange).toHaveBeenCalledWith("write");
    });

    it("toggles the outline, and shows a check while it is open", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar({ context: { showOutline: true } });

      await openMenu(user, "View");
      const outline = await screen.findByRole("menuitemcheckbox", { name: "Outline" });
      expect(outline).toHaveAttribute("aria-checked", "true");

      await user.click(outline);
      expect(handlers.onToggleOutline).toHaveBeenCalledTimes(1);
    });

    it("checks the stored theme preference, so System stays checked when it resolves to dark", async () => {
      const user = userEvent.setup();
      useThemeStore.setState({ resolvedTheme: "dark" });
      renderBar({ context: { appearance: { ...defaultSettings.appearance, theme: "system" } } });

      await openMenu(user, "View");
      await user.click(await screen.findByRole("menuitem", { name: "Theme" }));

      expect(await screen.findByRole("menuitemradio", { name: "System" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "false");
    });

    it("sets the theme preference and the colour scheme from their submenus", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "View");
      await user.click(await screen.findByRole("menuitem", { name: "Theme" }));
      await choose(user, await screen.findByRole("menuitemradio", { name: "Dark" }));
      expect(handlers.onSetThemePreference).toHaveBeenCalledWith("dark");

      await openMenu(user, "View");
      await user.click(await screen.findByRole("menuitem", { name: "Color Scheme" }));
      await choose(user, await screen.findByRole("menuitemradio", { name: "Ember" }));
      expect(handlers.onSetColorScheme).toHaveBeenCalledWith("sepia");
    });

    it("toggles word wrap and line numbers, reflecting the settings", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar({
        context: { editor: { ...defaultSettings.editor, wordWrap: true, lineNumbers: false } },
      });

      await openMenu(user, "View");
      const wrap = await screen.findByRole("menuitemcheckbox", { name: "Word Wrap" });
      const numbers = screen.getByRole("menuitemcheckbox", { name: "Line Numbers" });

      expect(wrap).toHaveAttribute("aria-checked", "true");
      expect(numbers).toHaveAttribute("aria-checked", "false");
      await user.click(numbers);
      expect(handlers.onToggleLineNumbers).toHaveBeenCalledTimes(1);
    });

    it("zooms out from the menu", async () => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "View");
      await user.click(await screen.findByRole("menuitem", { name: /Zoom Out/ }));
      expect(handlers.onZoom).toHaveBeenCalledWith("out");
    });

    it("disables Zoom In at the largest size and Reset Zoom at the default", async () => {
      const user = userEvent.setup();
      renderBar({ context: { appearance: { ...defaultSettings.appearance, editorFontSize: 24, previewFontScale: 1.5 } } });

      await openMenu(user, "View");

      expect(await screen.findByRole("menuitem", { name: /Zoom In/ })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("menuitem", { name: /Reset Zoom/ })).not.toHaveAttribute("aria-disabled", "true");
    });

    it("keeps theme, colour scheme and zoom usable with no document open, while the view options wait", async () => {
      const user = userEvent.setup();
      useDocumentStore.setState({ activeDocumentId: "" });
      renderBar();

      await openMenu(user, "View");

      expect(await screen.findByRole("menuitem", { name: "Mode" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("menuitemcheckbox", { name: "Outline" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("menuitem", { name: "Theme" })).not.toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("menuitem", { name: /Zoom In/ })).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Help menu", () => {
    it.each([
      ["Command Palette", "onOpenCommandPalette"],
      ["Take the tour", "onTakeTour"],
      ["Keyboard Shortcuts", "onOpenShortcuts"],
      ["Release Notes", "onOpenReleaseNotes"],
      ["Documentation", "onOpenDocs"],
      ["Report an Issue", "onReportIssue"],
      ["About Markora", "onOpenAbout"],
    ] as const)("%s calls %s", async (label, handler) => {
      const user = userEvent.setup();
      const { handlers } = renderBar();

      await openMenu(user, "Help");
      await user.click(await screen.findByRole("menuitem", { name: new RegExp(label) }));

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    });
  });

  it("moves between the menus with the arrow keys", async () => {
    const user = userEvent.setup();
    renderBar();

    screen.getByRole("menuitem", { name: "File" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("menuitem", { name: "Format" })).toHaveFocus();
  });

  describe("utilities", () => {
    it("keeps only the theme toggle and the view switcher beside the tabs", () => {
      renderBar();
      const utilities = within(screen.getByTestId("top-bar-utilities"));

      expect(utilities.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
      expect(utilities.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
      for (const name of ["Command palette", "Keyboard shortcuts", "Settings", "Outline"]) {
        expect(utilities.queryByRole("button", { name })).not.toBeInTheDocument();
      }
    });

    it("toggles the theme from the header button", async () => {
      const user = userEvent.setup();
      const { onThemeToggle } = renderBar();

      await user.click(screen.getByRole("button", { name: "Toggle theme" }));

      expect(onThemeToggle).toHaveBeenCalledTimes(1);
    });

    it("keeps the theme toggle available with nothing open", () => {
      useDocumentStore.setState({ activeDocumentId: "" });
      renderBar();

      expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    });

    it("switches the view from the view mode control", async () => {
      const user = userEvent.setup();
      const { onViewModeChange } = renderBar({ viewMode: "split" });

      const group = screen.getByRole("radiogroup", { name: "View mode" });
      await user.click(within(group).getByRole("radio", { name: "Read view" }));

      expect(onViewModeChange).toHaveBeenCalledWith("read");
    });

    it("offers Show syntax beside the view switcher in write view only", () => {
      const { unmount } = render(<TopBar viewMode="write" commands={[]} onViewModeChange={vi.fn()} />);
      expect(screen.getByRole("switch", { name: "Show syntax" })).toBeInTheDocument();
      unmount();

      for (const viewMode of ["split", "read"] as const) {
        const { unmount: close } = render(<TopBar viewMode={viewMode} commands={[]} onViewModeChange={vi.fn()} />);
        expect(screen.queryByRole("switch", { name: "Show syntax" })).not.toBeInTheDocument();
        close();
      }
    });

    it("reports a Show syntax change", async () => {
      const user = userEvent.setup();
      const onShowSyntaxChange = vi.fn();
      render(
        <TopBar viewMode="write" showSyntax={false} onShowSyntaxChange={onShowSyntaxChange} commands={[]} onViewModeChange={vi.fn()} />,
      );

      await user.click(screen.getByRole("switch", { name: "Show syntax" }));

      expect(onShowSyntaxChange).toHaveBeenCalledWith(true);
    });

    it("shows an install action only when the web app can be installed", async () => {
      const user = userEvent.setup();
      const onInstallApp = vi.fn();
      const { unmount } = render(
        <TopBar viewMode="split" commands={[]} onViewModeChange={vi.fn()} canInstallApp onInstallApp={onInstallApp} />,
      );

      await user.click(screen.getByRole("button", { name: "Install app" }));
      expect(onInstallApp).toHaveBeenCalled();
      unmount();

      render(<TopBar viewMode="split" commands={[]} onViewModeChange={vi.fn()} canInstallApp={false} />);
      expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
    });
  });

  it("anchors the Tour: menus for the command palette stop, theme toggle for the theme stop", () => {
    renderBar();

    expect(screen.getByTestId("top-bar-menu")).toHaveAttribute("data-tour", "command-palette");
    expect(screen.getByRole("button", { name: "Toggle theme" })).toHaveAttribute("data-tour", "theme");
  });
});

describe("TopBar update badge", () => {
  afterEach(() => useUpdateStore.setState({ status: "idle" }));

  it.each<UpdateStatus>(["available", "downloading", "ready"])("shows a labelled dot while an update is %s", (status) => {
    useUpdateStore.setState({ status });
    renderBar();

    expect(screen.getByTestId("update-badge")).toHaveAccessibleName("Update available");
  });

  it.each<UpdateStatus>(["idle", "checking", "up-to-date", "error"])("shows no dot while %s", (status) => {
    useUpdateStore.setState({ status });
    renderBar();

    expect(screen.queryByTestId("update-badge")).not.toBeInTheDocument();
  });

  it("never shows the dot when updates are not supported (web)", () => {
    useUpdateStore.setState({ status: "available" });
    renderBar({ context: { updatesSupported: false } });

    expect(screen.queryByTestId("update-badge")).not.toBeInTheDocument();
  });
});
