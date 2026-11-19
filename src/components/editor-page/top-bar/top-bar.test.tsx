import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";
import { useDocumentStore } from "../../../store/document";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { useThemeStore } from "../../../features/theme/theme-store";

function renderBar(props: Partial<Parameters<typeof TopBar>[0]> = {}) {
  const handlers = {
    onOpenSettings: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    onOpenKeyboardShortcuts: vi.fn(),
    onOpenAbout: vi.fn(),
    onOpenReleaseNotes: vi.fn(),
    onThemeToggle: vi.fn(),
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onCloseTab: vi.fn(),
    onExportHtml: vi.fn(),
    onExportPdf: vi.fn(),
    onToggleOutline: vi.fn(),
    onOpenRecent: vi.fn(),
    onViewModeChange: vi.fn(),
  };
  render(<TopBar viewMode="split" {...handlers} {...props} />);
  return handlers;
}

describe("TopBar", () => {
  beforeEach(() => {
    // Most controls only show while a document is open.
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

  it("shows File, Edit, View and Help while a document is open", () => {
    renderBar();

    for (const name of ["File", "Edit", "View", "Help"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
  });

  it("hides the document-only controls when nothing is open", () => {
    useDocumentStore.setState({ activeDocumentId: "" });
    renderBar();

    expect(screen.getByRole("menuitem", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "View mode" })).not.toBeInTheDocument();
    // The formatting toolbar is its own row now, not part of the header.
    expect(screen.queryByRole("toolbar", { name: "Formatting" })).not.toBeInTheDocument();
  });

  it("shows the wordmark only on the empty screen", () => {
    useDocumentStore.setState({ activeDocumentId: "" });
    const { unmount } = render(<TopBar viewMode="split" onViewModeChange={vi.fn()} />);
    expect(screen.getByText("Markora")).toBeInTheDocument();
    unmount();

    useDocumentStore.setState({ activeDocumentId: "doc-1" });
    render(<TopBar viewMode="split" onViewModeChange={vi.fn()} />);
    expect(screen.queryByText("Markora")).not.toBeInTheDocument();
  });

  it("shows Cmd shortcut labels on macOS", async () => {
    const user = userEvent.setup();
    const original = window.navigator.platform;
    Object.defineProperty(window.navigator, "platform", { configurable: true, value: "MacIntel" });
    renderBar();

    await user.click(screen.getByRole("menuitem", { name: "File" }));

    expect(screen.getByText("Cmd+N")).toBeInTheDocument();
    expect(screen.getByText("Cmd+Shift+S")).toBeInTheDocument();
    Object.defineProperty(window.navigator, "platform", { configurable: true, value: original });
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
      ["Export as HTML", /^Export as HTML/, "onExportHtml"],
      ["Export as PDF", /^Export as PDF/, "onExportPdf"],
      ["Settings", /^Settings/, "onOpenSettings"],
    ] as const)("%s calls %s", async (_label, name, handler) => {
      const user = userEvent.setup();
      const handlers = renderBar();

      await user.click(screen.getByRole("menuitem", { name: "File" }));
      await user.click(await screen.findByRole("menuitem", { name }));

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    });

    it("offers only New, Open and Settings when no document is open", async () => {
      const user = userEvent.setup();
      useDocumentStore.setState({ activeDocumentId: "" });
      renderBar();

      await user.click(screen.getByRole("menuitem", { name: "File" }));
      const menu = await screen.findByRole("menu");

      expect(within(menu).queryByRole("menuitem", { name: /^Save/ })).not.toBeInTheDocument();
      expect(within(menu).queryByRole("menuitem", { name: /Close Tab/ })).not.toBeInTheDocument();
      expect(within(menu).queryByRole("menuitem", { name: /^Export/ })).not.toBeInTheDocument();
      expect(within(menu).getByRole("menuitem", { name: /^New/ })).toBeInTheDocument();
    });

    it("lists recent files in a submenu and opens the one picked", async () => {
      const user = userEvent.setup();
      const handlers = renderBar({
        recentFiles: [
          { documentId: "doc-1", projectId: "proj-1", title: "notes.md" },
          { documentId: "doc-2", projectId: "proj-1", title: "readme.md" },
        ],
      });

      await user.click(screen.getByRole("menuitem", { name: "File" }));
      await user.click(await screen.findByRole("menuitem", { name: /Open Recent/ }));
      const readme = await screen.findByRole("menuitem", { name: "readme.md" });
      readme.focus();
      await user.keyboard("{Enter}");

      expect(handlers.onOpenRecent).toHaveBeenCalledWith("proj-1", "doc-2");
    });

    it("says so when there are no recent files", async () => {
      const user = userEvent.setup();
      renderBar({ recentFiles: [] });

      await user.click(screen.getByRole("menuitem", { name: "File" }));
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
      const runEditAction = vi.fn().mockResolvedValue(undefined);
      useEditorCommandState.setState({ runEditAction });
      renderBar();

      await user.click(screen.getByRole("menuitem", { name: "Edit" }));
      await user.click(await screen.findByRole("menuitem", { name: new RegExp(`^${label}`) }));

      expect(runEditAction).toHaveBeenCalledWith(action);
    });
  });

  describe("View menu", () => {
    it.each([
      ["Live View", "live"],
      ["Edit View", "edit"],
      ["Split View", "split"],
      ["Preview View", "preview"],
    ] as const)("%s switches to %s", async (label, mode) => {
      const user = userEvent.setup();
      const handlers = renderBar();

      await user.click(screen.getByRole("menuitem", { name: "View" }));
      await user.click(await screen.findByRole("menuitem", { name: label }));

      expect(handlers.onViewModeChange).toHaveBeenCalledWith(mode);
    });

    it("shows and hides the outline from the View menu, and says which it will do", async () => {
      const user = userEvent.setup();
      const handlers = renderBar({ showOutline: false });

      await user.click(screen.getByRole("menuitem", { name: "View" }));
      await user.click(await screen.findByRole("menuitem", { name: "Show Outline" }));

      expect(handlers.onToggleOutline).toHaveBeenCalledTimes(1);
    });

    it("offers Hide Outline while it is open", async () => {
      const user = userEvent.setup();
      renderBar({ showOutline: true });

      await user.click(screen.getByRole("menuitem", { name: "View" }));

      expect(await screen.findByRole("menuitem", { name: "Hide Outline" })).toBeInTheDocument();
    });

    it("keeps Toggle Theme available with no document open, without the view options", async () => {
      const user = userEvent.setup();
      useDocumentStore.setState({ activeDocumentId: "" });
      const handlers = renderBar();

      await user.click(screen.getByRole("menuitem", { name: "View" }));
      const menu = await screen.findByRole("menu");

      expect(within(menu).queryByRole("menuitem", { name: "Split View" })).not.toBeInTheDocument();
      await user.click(within(menu).getByRole("menuitem", { name: /Toggle Theme/ }));
      expect(handlers.onThemeToggle).toHaveBeenCalled();
    });
  });

  describe("Help menu", () => {
    it.each([
      ["Keyboard Shortcuts", "onOpenKeyboardShortcuts"],
      ["Release Notes", "onOpenReleaseNotes"],
      ["About Markora", "onOpenAbout"],
    ] as const)("%s calls %s", async (label, handler) => {
      const user = userEvent.setup();
      const handlers = renderBar();

      await user.click(screen.getByRole("menuitem", { name: "Help" }));
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
  });

  describe("utilities", () => {
    it.each([
      ["Command palette", "onOpenCommandPalette"],
      ["Keyboard shortcuts", "onOpenKeyboardShortcuts"],
      ["Settings", "onOpenSettings"],
    ] as const)("has a %s button, available with nothing open", async (name, handler) => {
      useDocumentStore.setState({ activeDocumentId: "" });
      const user = userEvent.setup();
      const handlers = renderBar();

      await user.click(
        within(screen.getByTestId("top-bar-utilities")).getByRole("button", { name }),
      );

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    });

    it("toggles the theme from the header button", async () => {
      const user = userEvent.setup();
      const handlers = renderBar();

      await user.click(screen.getByRole("button", { name: "Toggle theme" }));

      expect(handlers.onThemeToggle).toHaveBeenCalledTimes(1);
    });

    it("has an Outline toggle that reflects whether it is open", async () => {
      const user = userEvent.setup();
      const handlers = renderBar({ showOutline: true });
      const toggle = screen.getByRole("button", { name: "Outline" });

      expect(toggle).toHaveAttribute("aria-pressed", "true");
      await user.click(toggle);

      expect(handlers.onToggleOutline).toHaveBeenCalledTimes(1);
    });

    it("has no Outline toggle with nothing open", () => {
      useDocumentStore.setState({ activeDocumentId: "" });
      renderBar();

      expect(screen.queryByRole("button", { name: "Outline" })).not.toBeInTheDocument();
    });

    it("switches the view from the view mode control", async () => {
      const user = userEvent.setup();
      const handlers = renderBar({ viewMode: "split" });

      const group = screen.getByRole("radiogroup", { name: "View mode" });
      await user.click(within(group).getByRole("radio", { name: "Preview view" }));

      expect(handlers.onViewModeChange).toHaveBeenCalledWith("preview");
    });

    it("shows an install action only when the web app can be installed", async () => {
      const user = userEvent.setup();
      const onInstallApp = vi.fn();
      const { unmount } = render(
        <TopBar viewMode="split" onViewModeChange={vi.fn()} canInstallApp onInstallApp={onInstallApp} />,
      );

      await user.click(screen.getByRole("button", { name: "Install app" }));
      expect(onInstallApp).toHaveBeenCalled();
      unmount();

      render(<TopBar viewMode="split" onViewModeChange={vi.fn()} canInstallApp={false} />);
      expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
    });
  });
});
