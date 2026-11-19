import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import packageJson from "../package.json";
import App from "./App";
import { untitledStarterContent, useDocumentStore } from "./store/document";
import { CURRENT_TOUR_VERSION, createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useEditorCommandState } from "./features/editor/editor-command-state";
import { useThemeStore } from "./features/theme/theme-store";

/** Settings for a user who has already dealt with the Tour prompt, so it stays out of the way. */
function createSeenSettings() {
  const settings = createDefaultSettings();
  settings.onboarding.tourVersion = CURRENT_TOUR_VERSION;
  return settings;
}

const { invokeMock, openMock, saveMock, readFileMock, writeFileMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  openMock: vi.fn(),
  saveMock: vi.fn(),
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("./platform/files", () => ({
  getFileAdapter: () => ({
    pickOpenPath: openMock,
    pickSavePath: saveMock,
    readFile: readFileMock,
    writeFile: writeFileMock,
    supportsDirectoryAccess: () => false,
    supportsFileImport: () => false,
    supportsFileExport: () => false,
  }),
}));

vi.mock("./platform/persistence/web", () => ({
  loadWorkspaceSnapshot: vi.fn().mockResolvedValue(null),
  saveWorkspaceSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./app/app-shell", () => ({
  AppShell: ({
    header,
    toolbar,
    workspace,
    statusBar,
  }: {
    header: React.ReactNode;
    toolbar?: React.ReactNode;
    workspace: React.ReactNode;
    statusBar: React.ReactNode;
  }) => (
    <div>
      {header}
      {toolbar}
      {workspace}
      {statusBar}
    </div>
  ),
}));

vi.mock("./components/editor-page/editor-pane", () => ({
  EditorPane: () => <div>Editor Pane</div>,
}));

vi.mock("./components/editor-page/preview-pane", () => ({
  PreviewPane: () => <div>Preview Pane</div>,
}));

vi.mock("./components/editor-page/workspace", () => ({
  Workspace: ({ sidebar, left, right }: { sidebar?: React.ReactNode; left: React.ReactNode; right: React.ReactNode }) => (
    <div>
      {sidebar}
      {left}
      {right}
    </div>
  ),
}));

vi.mock("./components/editor-page/top-bar", () => ({
  TopBar: ({
    tabs,
    commands,
  }: {
    tabs?: React.ReactNode;
    commands: Array<{ id: string; run: () => void }>;
  }) => {
    const run = (id: string) => () => commands.find((command) => command.id === id)?.run();
    return (
      <div>
        <button type="button" onClick={run("app.settings")}>
          open-settings
        </button>
        <button type="button" onClick={run("help.shortcuts")}>
          open-shortcuts
        </button>
        <button type="button" onClick={run("help.about")}>
          open-about
        </button>
        <button type="button" onClick={run("file.close")}>
          close-from-menu
        </button>
        <button type="button" onClick={run("view.word-wrap")}>
          toggle-word-wrap
        </button>
        <button type="button" onClick={run("view.zoom-in")}>
          zoom-in
        </button>
        <button type="button" onClick={run("view.theme.dark")}>
          theme-dark
        </button>
        {tabs}
        <div>Top Bar</div>
      </div>
    );
  },
}));

vi.mock("./components/editor-page/formatting-toolbar", () => ({
  FormattingBar: () => <div>Formatting Bar</div>,
}));

vi.mock("./components/editor-page/footer-status-bar", () => ({
  FooterStatusBar: () => <div>Footer Status</div>,
}));

vi.mock("./components/editor-page/tab-strip", () => ({
  TabStrip: ({
    tabs,
    activeTabId,
    onCloseTab,
    onCloseAllTabs,
    onNewTab,
  }: {
    tabs: Array<{ id: string; filePath: string | null }>;
    activeTabId: string;
    onCloseTab: (id: string) => void;
    onCloseAllTabs: () => void;
    onNewTab: () => void;
  }) => (
    <div>
      <div>{tabs.length} tabs</div>
      <button type="button" onClick={() => onCloseTab(activeTabId)}>
        close-active
      </button>
      <button type="button" onClick={onCloseAllTabs}>
        close-all
      </button>
      <button type="button" onClick={onNewTab}>
        new-tab
      </button>
    </div>
  ),
}));

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    invokeMock.mockReset();
    openMock.mockReset();
    saveMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    // @ts-expect-error test cleanup
    delete window.__TAURI_INTERNALS__;
  });

  beforeEach(() => {
    // @ts-expect-error test shim
    window.__TAURI_INTERNALS__ = {};
    const settings = createSeenSettings();
    useDocumentStore.setState({
      openDocuments: [
        { id: "document-1", content: untitledStarterContent, filePath: null, isDirty: false },
        { id: "document-2", content: "# Dirty", filePath: "D:\\notes\\dirty.md", isDirty: true },
      ],
      activeDocumentId: "document-2",
      content: "# Dirty",
      filePath: "D:\\notes\\dirty.md",
      isDirty: true,
    });
    useSettingsStore.setState({
      isHydrated: false,
      settings,
      templateDraft: settings.authoring.newDocumentTemplate,
    });
    useWorkspaceState.setState({ viewMode: "edit" });
    useThemeStore.setState({
      themePreference: "system",
      systemTheme: "light",
      resolvedTheme: "light",
    });
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return settings;
      }

      return undefined;
    });
    readFileMock.mockResolvedValue("# Preview");
  });

  it("opens the command palette with Ctrl+K and runs a command from it", async () => {
    const user = userEvent.setup();

    render(<App />);
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const palette = await screen.findByRole("dialog", { name: "Command palette" });
    expect(within(palette).getByRole("option", { name: /Save As/ })).toBeInTheDocument();

    await user.type(within(palette).getByPlaceholderText("Type a command..."), "split");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(useWorkspaceState.getState().viewMode).toBe("split"));
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
  });

  it("opens a custom discard dialog for dirty active tabs", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-active" }));

    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("does not close a dirty active tab when the user cancels the discard dialog", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-active" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().activeDocumentId).toBe("document-2");
  });

  it("closes a dirty active tab when the user confirms the discard dialog", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-active" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(1);
    expect(useDocumentStore.getState().activeDocumentId).toBe("document-1");
  });

  it("opens one discard dialog when closing all tabs with unsaved changes", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-all" }));

    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
  });

  it("closes all tabs when the user confirms the bulk discard dialog", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-all" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(0);
    expect(useDocumentStore.getState().activeDocumentId).toBe("");
    expect(screen.getByRole("heading", { name: "No document open" })).toBeInTheDocument();
  });

  it("uses the saved template for newly created tabs", async () => {
    const user = userEvent.setup();
    const settings = createSeenSettings();
    settings.authoring.newDocumentTemplate = "# Saved template";
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return settings;
      }

      return undefined;
    });

    render(<App />);
    await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));
    await user.click(screen.getByRole("button", { name: "new-tab" }));

    expect(useDocumentStore.getState().content).toBe("# Saved template");
  });

  it("closes dirty tabs without confirmation when the setting is disabled", async () => {
    const user = userEvent.setup();
    const settings = createSeenSettings();
    settings.files.confirmOnUnsavedClose = false;
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return settings;
      }

      return undefined;
    });
    render(<App />);
    await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));
    await user.click(screen.getByRole("button", { name: "close-active" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(1);
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("closes all tabs without confirmation when the unsaved-close setting is disabled", async () => {
    const user = userEvent.setup();
    const settings = createSeenSettings();
    settings.files.confirmOnUnsavedClose = false;
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return settings;
      }

      return undefined;
    });

    render(<App />);
    await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));
    await user.click(screen.getByRole("button", { name: "close-all" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(0);
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("closes a clean active tab without confirmation", async () => {
    const user = userEvent.setup();
    useDocumentStore.setState({
      openDocuments: [{ id: "document-2", content: "# Clean", filePath: "D:\\notes\\clean.md", isDirty: false }],
      activeDocumentId: "document-2",
      content: "# Clean",
      filePath: "D:\\notes\\clean.md",
      isDirty: false,
    });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-active" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(0);
    expect(useDocumentStore.getState().activeDocumentId).toBe("");
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No document open" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New document" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open file" })).toBeInTheDocument();
  });

  it("selects an already-open file when opening the same path again", async () => {
    const user = userEvent.setup();
    useDocumentStore.setState({
      openDocuments: [
        { id: "document-1", content: untitledStarterContent, filePath: null, isDirty: false },
        {
          id: "document-2",
          content: "# Existing file",
          filePath: "D:\\notes\\daily.md",
          isDirty: false,
        },
      ],
      activeDocumentId: "document-1",
      content: untitledStarterContent,
      filePath: null,
      isDirty: false,
    });
    openMock.mockResolvedValue("D:\\notes\\daily.md");
    readFileMock.mockResolvedValue("# Fresh from disk");
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return createSeenSettings();
      }

      return undefined;
    });

    render(<App />);
    await user.keyboard("{Control>}o{/Control}");

    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().activeDocumentId).toBe("document-2");
    expect(useDocumentStore.getState().content).toBe("# Fresh from disk");
  });

  it("creates a new tab without prompting to discard dirty changes", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "new-tab" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(3);
    expect(useDocumentStore.getState().activeDocumentId).not.toBe("document-2");
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("creates a new document from the empty state CTA", async () => {
    const user = userEvent.setup();
    useDocumentStore.setState({
      openDocuments: [],
      activeDocumentId: "",
      content: "",
      filePath: null,
      isDirty: false,
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "New document" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(1);
    expect(useDocumentStore.getState().activeDocumentId).toBe("document-1");
    expect(useDocumentStore.getState().content).toBe(untitledStarterContent);
  });

  it("opens a file from the empty state CTA", async () => {
    const user = userEvent.setup();
    useDocumentStore.setState({
      openDocuments: [],
      activeDocumentId: "",
      content: "",
      filePath: null,
      isDirty: false,
    });
    openMock.mockResolvedValue("D:\\notes\\empty-state.md");
    readFileMock.mockResolvedValue("# Empty state open");
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "load_settings") {
        return createSeenSettings();
      }

      return undefined;
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open file" }));

    expect(useDocumentStore.getState().openDocuments).toHaveLength(1);
    expect(useDocumentStore.getState().filePath).toBe("D:\\notes\\empty-state.md");
    expect(useDocumentStore.getState().content).toBe("# Empty state open");
  });

  it("cycles to the next tab with ctrl+tab", () => {
    useDocumentStore.setState({
      openDocuments: [
        { id: "document-1", content: untitledStarterContent, filePath: null, isDirty: false },
        { id: "document-2", content: "# Second", filePath: "D:\\notes\\second.md", isDirty: false },
        { id: "document-3", content: "# Third", filePath: "D:\\notes\\third.md", isDirty: false },
      ],
      activeDocumentId: "document-1",
      content: untitledStarterContent,
      filePath: null,
      isDirty: false,
    });

    render(<App />);
    fireEvent.keyDown(window, { key: "Tab", ctrlKey: true });

    expect(useDocumentStore.getState().activeDocumentId).toBe("document-2");
  });

  it("cycles to the previous tab with ctrl+shift+tab", () => {
    useDocumentStore.setState({
      openDocuments: [
        { id: "document-1", content: untitledStarterContent, filePath: null, isDirty: false },
        { id: "document-2", content: "# Second", filePath: "D:\\notes\\second.md", isDirty: false },
        { id: "document-3", content: "# Third", filePath: "D:\\notes\\third.md", isDirty: false },
      ],
      activeDocumentId: "document-2",
      content: "# Second",
      filePath: "D:\\notes\\second.md",
      isDirty: false,
    });

    render(<App />);
    fireEvent.keyDown(window, { key: "Tab", ctrlKey: true, shiftKey: true });

    expect(useDocumentStore.getState().activeDocumentId).toBe("document-1");
  });

  it("opens the settings screen from the top bar", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-settings" }));

    expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
    expect(screen.queryByText("Top Bar")).not.toBeInTheDocument();
    expect(screen.queryByText("Footer Status")).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+ tabs$/)).not.toBeInTheDocument();
  });

  it("opens the keyboard shortcuts dialog from the help menu action", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-shortcuts" }));

    expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeInTheDocument();
    expect(screen.getByText("Ctrl+N")).toBeInTheDocument();
  });

  it("opens the about dialog from the help menu action", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-about" }));

    expect(screen.getByRole("dialog", { name: "About Markora" })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Version ${packageJson.version.replace(".", "\\.")}`, "i"))).toBeInTheDocument();
  });

  it("opens the discard dialog when closing the current tab from the menu", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-from-menu" }));

    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
  });

  it("persists an editor setting as soon as it is changed", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-settings" }));
    await user.click(screen.getByLabelText("Show line numbers"));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
      "save_settings",
      expect.objectContaining({
        settings: expect.objectContaining({
          editor: expect.objectContaining({ lineNumbers: true }),
        }),
      }),
      ),
    );
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("toggles word wrap from the View menu command and saves it", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "toggle-word-wrap" }));

    expect(useSettingsStore.getState().settings.editor.wordWrap).toBe(false);
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
        "save_settings",
        expect.objectContaining({
          settings: expect.objectContaining({ editor: expect.objectContaining({ wordWrap: false }) }),
        }),
      ),
    );
  });

  it("zooms the editor and the preview together from the View menu command and saves it", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "zoom-in" }));

    const { appearance } = useSettingsStore.getState().settings;
    expect(appearance.editorFontSize).toBe(18);
    expect(appearance.previewFontScale).toBe(1.1);
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
        "save_settings",
        expect.objectContaining({
          settings: expect.objectContaining({
            appearance: expect.objectContaining({ editorFontSize: 18, previewFontScale: 1.1 }),
          }),
        }),
      ),
    );
  });

  it("sets the theme preference from the View menu and saves it", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "theme-dark" }));

    expect(useSettingsStore.getState().settings.appearance.theme).toBe("dark");
    expect(useThemeStore.getState().themePreference).toBe("dark");
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
        "save_settings",
        expect.objectContaining({
          settings: expect.objectContaining({ appearance: expect.objectContaining({ theme: "dark" }) }),
        }),
      ),
    );
  });

  it("persists a preview setting as soon as it is changed (#12)", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-settings" }));
    await user.click(screen.getByRole("switch", { name: "Open links in your browser" }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
      "save_settings",
      expect.objectContaining({
        settings: expect.objectContaining({
          preview: expect.objectContaining({ openLinksExternally: false }),
        }),
      }),
      ),
    );
    expect(useSettingsStore.getState().settings.preview.openLinksExternally).toBe(false);
  });

  it("saves a dirty file automatically when autosave is on (#11)", async () => {
    const autosaveSettings = createSeenSettings();
    autosaveSettings.files.autosave = true;
    invokeMock.mockImplementation(async (command: string) =>
      command === "load_settings" ? autosaveSettings : undefined,
    );

    render(<App />);

    await waitFor(() => expect(writeFileMock).toHaveBeenCalledWith("D:\\notes\\dirty.md", "# Dirty"), {
      timeout: 4000,
    });
    await waitFor(() => expect(useDocumentStore.getState().isDirty).toBe(false));
  });

  it("does not save automatically when autosave is off (#11)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<App />);
      await vi.advanceTimersByTimeAsync(5000);

      expect(writeFileMock).not.toHaveBeenCalled();
      expect(useDocumentStore.getState().isDirty).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reopens last session's files when restore is on (#11)", async () => {
    localStorage.setItem(
      "markora:session",
      JSON.stringify({ openPaths: ["D:\\notes\\restored.md"], activePath: "D:\\notes\\restored.md" }),
    );
    const restoreSettings = createSeenSettings();
    restoreSettings.files.restorePreviousSession = true;
    invokeMock.mockImplementation(async (command: string) =>
      command === "load_settings" ? restoreSettings : undefined,
    );
    readFileMock.mockResolvedValue("# Restored");

    render(<App />);

    await waitFor(() => expect(useDocumentStore.getState().filePath).toBe("D:\\notes\\restored.md"));
    expect(readFileMock).toHaveBeenCalledWith("D:\\notes\\restored.md");
    expect(useDocumentStore.getState().content).toBe("# Restored");
    localStorage.clear();
  });

  it("leaves the tabs alone on launch when restore is off (#11)", async () => {
    localStorage.setItem(
      "markora:session",
      JSON.stringify({ openPaths: ["D:\\notes\\restored.md"], activePath: null }),
    );

    render(<App />);
    await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));

    expect(readFileMock).not.toHaveBeenCalled();
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    localStorage.clear();
  });

  describe("outline (#16)", () => {
    afterEach(() => useWorkspaceState.setState({ showOutline: false }));

    const withHeadings = () => {
      const markdown = "# Title\n\n## Setup\n\ntext\n\n## Usage\n";
      useDocumentStore.setState({
        openDocuments: [{ id: "document-1", content: markdown, filePath: "D:\\notes\\a.md", isDirty: false }],
        activeDocumentId: "document-1",
        content: markdown,
        filePath: "D:\\notes\\a.md",
        isDirty: false,
      });
    };

    it("is closed by default", () => {
      withHeadings();

      render(<App />);

      expect(screen.queryByRole("complementary", { name: "Outline" })).not.toBeInTheDocument();
    });

    it("lists the document's headings when opened", () => {
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });

      render(<App />);

      const nav = screen.getByRole("navigation", { name: "Document headings" });
      expect(within(nav).getAllByRole("button").map((button) => button.textContent)).toEqual(["Title", "Setup", "Usage"]);
    });

    it("jumps the editor to a heading's line when it is clicked", async () => {
      const user = userEvent.setup();
      const goToLine = vi.fn();
      useEditorCommandState.setState({ goToLine });
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });

      render(<App />);
      await user.click(screen.getByRole("button", { name: "Usage" }));

      expect(goToLine).toHaveBeenCalledWith(7);
    });

    it("closes from its close button", async () => {
      const user = userEvent.setup();
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });

      render(<App />);
      await user.click(screen.getByRole("button", { name: "Close outline" }));

      expect(screen.queryByRole("complementary", { name: "Outline" })).not.toBeInTheDocument();
      expect(useWorkspaceState.getState().showOutline).toBe(false);
    });
  });

  describe("tour prompt", () => {
    function loadSettingsWithTourVersion(tourVersion: number) {
      const stored = createSeenSettings();
      stored.onboarding.tourVersion = tourVersion;
      invokeMock.mockImplementation(async (command: string) =>
        command === "load_settings" ? stored : undefined,
      );
    }

    it("is offered once to an unseen user", async () => {
      loadSettingsWithTourVersion(0);

      render(<App />);

      expect(await screen.findByRole("dialog", { name: "Take a quick tour?" })).toBeInTheDocument();
    });

    it("is not offered to a user who has already seen the current tour", async () => {
      loadSettingsWithTourVersion(CURRENT_TOUR_VERSION);

      render(<App />);
      await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));

      expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
    });

    it("is not flashed before the saved settings have loaded", () => {
      render(<App />);

      expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
    });

    it("records the tour version and goes away when skipped", async () => {
      const user = userEvent.setup();
      loadSettingsWithTourVersion(0);

      render(<App />);
      await user.click(await screen.findByRole("button", { name: "Skip" }));

      expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
      expect(useSettingsStore.getState().settings.onboarding.tourVersion).toBe(CURRENT_TOUR_VERSION);
      await waitFor(() =>
        expect(invokeMock).toHaveBeenCalledWith(
          "save_settings",
          expect.objectContaining({
            settings: expect.objectContaining({
              onboarding: { tourVersion: CURRENT_TOUR_VERSION },
            }),
          }),
        ),
      );
    });
  });
});
