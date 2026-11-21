import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import type { DndContextProps, DragEndEvent } from "@dnd-kit/core";
import packageJson from "../package.json";
import App from "./App";
import { untitledStarterContent, useDocumentStore } from "./store/document";
import { CURRENT_TOUR_VERSION, createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useEditorCommandState } from "./features/editor/editor-command-state";
import { useThemeStore } from "./features/theme/theme-store";
import { useUpdateStore } from "./features/updates/update-store";
import { scrollPreviewToHeading } from "./features/outline/scroll-to-heading";
import { readShortcuts } from "./components/shortcut-keys";

/** Settings for a user who has already dealt with the Tour prompt, so it stays out of the way. */
function createSeenSettings() {
  const settings = createDefaultSettings();
  settings.onboarding.tourVersion = CURRENT_TOUR_VERSION;
  return settings;
}

const { invokeMock, openMock, saveMock, readFileMock, writeFileMock, getCurrentVersionMock, pendingStore } = vi.hoisted(
  () => ({
    getCurrentVersionMock: vi.fn(),
    // Stands in for the file the Rust side keeps the pending what's new record in.
    pendingStore: { record: null as { version: string; notes: string; publishedAt: string | null } | null },
    invokeMock: vi.fn(),
    openMock: vi.fn(),
    saveMock: vi.fn(),
    readFileMock: vi.fn(),
    writeFileMock: vi.fn(),
  }),
);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

// Only the running version and the pending record matter here; checks fail silently, as they do offline.
vi.mock("./platform/updates", () => ({
  getUpdateAdapter: () => ({
    getCurrentVersion: getCurrentVersionMock,
    savePendingWhatsNew: async (record: typeof pendingStore.record) => {
      pendingStore.record = record;
    },
    loadPendingWhatsNew: async () => pendingStore.record,
    clearPendingWhatsNew: async () => {
      pendingStore.record = null;
    },
    checkForUpdate: vi.fn().mockRejectedValue(new Error("offline")),
    download: vi.fn(),
    install: vi.fn(),
    relaunch: vi.fn(),
  }),
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

// The tour library is covered by its own tests; here the runner just reports how the tour ended.
vi.mock("./components/editor-page/tour/tour-runner", () => ({
  default: ({ onEnd }: { onEnd: (event: "skip" | "finish") => void }) => (
    <div>
      <p>tour is running</p>
      <button onClick={() => onEnd("finish")}>End tour: finish</button>
      <button onClick={() => onEnd("skip")}>End tour: skip</button>
    </div>
  ),
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

vi.mock("./features/outline/scroll-to-heading", () => ({
  scrollPreviewToHeading: vi.fn(() => true),
}));

// jsdom has no layout, so a test runs the handlers a drag would run, taken from the props the outline gives dnd-kit.
const dnd = vi.hoisted(() => ({ props: null as unknown }));
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: (props: DndContextProps) => {
      dnd.props = props;
      return <actual.DndContext {...props} />;
    },
  };
});
const dropRow = (active: number, over: number) =>
  act(() =>
    (dnd.props as { onDragEnd: (event: DragEndEvent) => void }).onDragEnd({
      active: { id: String(active) },
      over: { id: String(over) },
    } as unknown as DragEndEvent),
  );

// Counts mounts, so a test can prove an editor was kept (undo history, cursor) rather than rebuilt.
const editorMounts = vi.hoisted(() => ({ count: 0 }));

vi.mock("./components/editor-page/editor-pane", async () => {
  // Imported here: a hoisted factory can't see the file's top-level imports.
  const { useEffect } = await import("react");
  return {
  EditorPane: ({ live, focusDim }: { live?: boolean; focusDim?: boolean }) => {
    useEffect(() => {
      editorMounts.count += 1;
    }, []);
    return (
      <div data-testid="editor-pane" data-live={String(Boolean(live))} data-focus-dim={String(Boolean(focusDim))}>
        Editor Pane
      </div>
    );
  },
  };
});

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
        <button type="button" onClick={run("help.check-for-updates")}>
          check-for-updates
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
  FormattingBar: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="formatting-bar" data-disabled={String(Boolean(disabled))}>
      Formatting Bar
    </div>
  ),
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
    useWorkspaceState.setState({ viewMode: "write", showSyntax: false, focusMode: false });
    editorMounts.count = 0;
    vi.mocked(scrollPreviewToHeading).mockClear();
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

  it("opens settings and checks for updates from the Check for updates command", async () => {
    const user = userEvent.setup();
    const check = vi.fn().mockResolvedValue(undefined);
    const original = useUpdateStore.getState().check;
    useUpdateStore.setState({ check });

    try {
      render(<App />);
      await user.click(screen.getByRole("button", { name: "check-for-updates" }));

      expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
      expect(check).toHaveBeenCalledWith();
    } finally {
      useUpdateStore.setState({ check: original });
    }
  });

  it("opens settings without checking again when a release is already waiting", async () => {
    const user = userEvent.setup();
    const check = vi.fn().mockResolvedValue(undefined);
    const original = useUpdateStore.getState();
    useUpdateStore.setState({ check, status: "available", update: { version: "1.6.0", notes: "", publishedAt: null } });

    try {
      render(<App />);
      await user.click(screen.getByRole("button", { name: "check-for-updates" }));

      expect(screen.getByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
      // The launch-time check is silent and carries options; the command would call it with none.
      expect(check).not.toHaveBeenCalledWith();
    } finally {
      useUpdateStore.setState({ check: original.check, status: original.status, update: original.update });
    }
  });

  it("opens the keyboard shortcuts dialog from the help menu action", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-shortcuts" }));

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    expect(readShortcuts(dialog)).toContain("Ctrl+N");
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
      // The drag handles are buttons too (named "Move section: ..."); the rows are the ones without that label.
      const rows = within(nav).getAllByRole("button").filter((button) => !button.hasAttribute("aria-label"));
      expect(rows.map((button) => button.textContent)).toEqual(["Title", "Setup", "Usage"]);
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
      expect(scrollPreviewToHeading).not.toHaveBeenCalled();
    });

    it("scrolls the preview, not the hidden editor, when a heading is clicked in Read", async () => {
      const user = userEvent.setup();
      const goToLine = vi.fn();
      useEditorCommandState.setState({ goToLine });
      withHeadings();
      useWorkspaceState.setState({ showOutline: true, viewMode: "read" });

      render(<App />);
      await user.click(screen.getByRole("button", { name: "Usage" }));

      expect(scrollPreviewToHeading).toHaveBeenCalledWith(2, 3);
      expect(goToLine).not.toHaveBeenCalled();
    });

    it("shows each section's word count, sub-sections included", () => {
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });

      render(<App />);

      // "# Title" covers the whole document: Title, Setup, text, Usage.
      expect(screen.getByText("4 words")).toBeInTheDocument();
      expect(screen.getByText("2 words")).toBeInTheDocument();
      expect(screen.getByText("1 word")).toBeInTheDocument();
    });

    it("keeps the word counts up to date as the document changes", () => {
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });
      render(<App />);

      act(() => useDocumentStore.setState({ content: "# Title\n\n## Setup\n\ntext and a few more\n\n## Usage\n" }));

      expect(screen.getByText("8 words")).toBeInTheDocument();
      expect(screen.getByText("6 words")).toBeInTheDocument();
    });

    it("gives every outline row a handle for moving its section", () => {
      withHeadings();
      useWorkspaceState.setState({ showOutline: true });

      render(<App />);

      for (const name of ["Title", "Setup", "Usage"]) {
        expect(screen.getByRole("button", { name: `Move section: ${name}` })).toBeInTheDocument();
      }
    });

    it.each(["write", "read"] as const)("moves a section in the editor when a row is dropped, in the %s view", (viewMode) => {
      const moveSection = vi.fn();
      useEditorCommandState.setState({ moveSection });
      withHeadings();
      useWorkspaceState.setState({ showOutline: true, viewMode });

      render(<App />);
      // Title 0, Setup 1, Usage 2: Usage dropped on Setup lands before Setup.
      dropRow(2, 1);

      expect(moveSection).toHaveBeenCalledTimes(1);
      expect(moveSection).toHaveBeenCalledWith(2, 1);
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

  describe("view modes", () => {
    const editor = () => screen.getByTestId("editor-pane");

    it("renders markdown inline in Write while Show syntax is off", () => {
      useWorkspaceState.setState({ viewMode: "write", showSyntax: false });

      render(<App />);

      expect(editor()).toHaveAttribute("data-live", "true");
    });

    it("shows raw markdown in Write once Show syntax is on", () => {
      useWorkspaceState.setState({ viewMode: "write", showSyntax: true });

      render(<App />);

      expect(editor()).toHaveAttribute("data-live", "false");
    });

    it("shows raw markdown beside the preview in Side-by-side, whatever Show syntax says", () => {
      useWorkspaceState.setState({ viewMode: "split", showSyntax: false });

      render(<App />);

      expect(editor()).toHaveAttribute("data-live", "false");
    });

    it("turns Show syntax on and off from the command palette while writing", async () => {
      const user = userEvent.setup();
      render(<App />);

      for (const expected of [true, false]) {
        fireEvent.keyDown(window, { key: "k", ctrlKey: true });
        const palette = await screen.findByRole("dialog", { name: "Command palette" });
        await user.type(within(palette).getByPlaceholderText("Type a command..."), "show syntax");
        await user.keyboard("{Enter}");

        await waitFor(() => expect(useWorkspaceState.getState().showSyntax).toBe(expected));
        expect(editor()).toHaveAttribute("data-live", String(!expected));
      }
    });

    it.each([
      ["write", "false"],
      ["split", "false"],
      ["read", "true"],
    ] as const)("disables the formatting bar only in Read, where the editor is hidden (%s)", (viewMode, disabled) => {
      useWorkspaceState.setState({ viewMode });

      render(<App />);

      expect(screen.getByTestId("formatting-bar")).toHaveAttribute("data-disabled", disabled);
    });

    it("does not offer Show Syntax outside Write", async () => {
      const user = userEvent.setup();
      useWorkspaceState.setState({ viewMode: "read" });
      render(<App />);

      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      const palette = await screen.findByRole("dialog", { name: "Command palette" });
      await user.type(within(palette).getByPlaceholderText("Type a command..."), "show syntax");

      expect(within(palette).queryByRole("option", { name: /Show Syntax/ })).not.toBeInTheDocument();
    });
  });

  describe("Focus", () => {
    const editor = () => screen.getByTestId("editor-pane");
    const toggleWithShortcut = () => fireEvent.keyDown(window, { key: "F", ctrlKey: true, shiftKey: true });
    const chrome = () => [
      screen.queryByText("Top Bar"),
      screen.queryByTestId("formatting-bar"),
      screen.queryByText("Footer Status"),
      screen.queryByRole("complementary", { name: "Outline" }),
    ];
    const hydrated = () => waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));

    async function runFromPalette(user: ReturnType<typeof userEvent.setup>, query: string) {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      const palette = await screen.findByRole("dialog", { name: "Command palette" });
      await user.type(within(palette).getByPlaceholderText("Type a command..."), query);
      await user.keyboard("{Enter}");
    }

    it("hides the top bar, formatting bar, status bar and outline while on, and brings them back", () => {
      useWorkspaceState.setState({ showOutline: true });
      render(<App />);
      for (const element of chrome()) expect(element).toBeInTheDocument();

      act(() => useWorkspaceState.getState().setFocusMode(true));
      for (const element of chrome()) expect(element).not.toBeInTheDocument();

      act(() => useWorkspaceState.getState().setFocusMode(false));
      for (const element of chrome()) expect(element).toBeInTheDocument();
      expect(useWorkspaceState.getState().showOutline).toBe(true);
    });

    it("toggles with Ctrl+Shift+F", () => {
      render(<App />);

      toggleWithShortcut();
      expect(useWorkspaceState.getState().focusMode).toBe(true);

      toggleWithShortcut();
      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("puts the keyboard focus in the editor when it turns on, since the menu that was used leaves none", async () => {
      const focusEditor = vi.fn();
      useEditorCommandState.setState({ focusEditor });
      render(<App />);

      toggleWithShortcut();
      await waitFor(() => expect(focusEditor).toHaveBeenCalledTimes(1));

      toggleWithShortcut();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(focusEditor).toHaveBeenCalledTimes(1);
    });

    it("does not touch the editor focus when Focus can't turn on", async () => {
      const focusEditor = vi.fn();
      useEditorCommandState.setState({ focusEditor });
      useWorkspaceState.setState({ viewMode: "read" });
      render(<App />);

      toggleWithShortcut();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(focusEditor).not.toHaveBeenCalled();
    });

    it("toggles from the command palette", async () => {
      const user = userEvent.setup();
      render(<App />);

      await runFromPalette(user, "focus");

      await waitFor(() => expect(useWorkspaceState.getState().focusMode).toBe(true));
    });

    it("does nothing from the shortcut outside Write", () => {
      useWorkspaceState.setState({ viewMode: "read" });
      render(<App />);

      toggleWithShortcut();

      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("says how to leave when it turns on, and only then", async () => {
      render(<App />);

      toggleWithShortcut();
      expect(await screen.findByText("Focus on. Esc to exit.")).toBeInTheDocument();
      // The toast renders its text in more than one place (title and screen-reader copy), so compare counts.
      const whileOn = screen.getAllByText("Focus on. Esc to exit.").length;

      toggleWithShortcut();
      expect(screen.getAllByText("Focus on. Esc to exit.")).toHaveLength(whileOn);
    });

    it("keeps the same editor, so undo history and the cursor survive", () => {
      render(<App />);
      expect(editorMounts.count).toBe(1);

      act(() => useWorkspaceState.getState().setFocusMode(true));
      act(() => useWorkspaceState.getState().setFocusMode(false));

      expect(editorMounts.count).toBe(1);
    });

    it.each([
      ["narrow", "60ch"],
      ["normal", "72ch"],
      ["wide", "90ch"],
    ] as const)("centers the editor at the %s content width while on, and not otherwise", async (width, measure) => {
      render(<App />);
      await hydrated();
      act(() => useSettingsStore.getState().updatePreview({ contentWidth: width }));
      const wrapper = editor().parentElement as HTMLElement;
      expect(wrapper.style.maxWidth).toBe("");

      act(() => useWorkspaceState.getState().setFocusMode(true));
      expect(wrapper.style.maxWidth).toBe(measure);

      act(() => useWorkspaceState.getState().setFocusMode(false));
      expect(wrapper.style.maxWidth).toBe("");
    });

    it("dims other paragraphs only while on and the setting is on", async () => {
      render(<App />);
      await hydrated();
      expect(editor()).toHaveAttribute("data-focus-dim", "false");

      act(() => useWorkspaceState.getState().setFocusMode(true));
      expect(editor()).toHaveAttribute("data-focus-dim", "true");

      act(() => useSettingsStore.getState().updateEditor({ focusDimming: false }));
      expect(editor()).toHaveAttribute("data-focus-dim", "false");
    });

    it("leaves on Esc, but not when something earlier already used the Esc", () => {
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));

      // The find bar, slash menu, menus and dialogs all prevent default on the Esc they act on.
      const widget = (event: Event) => event.preventDefault();
      document.addEventListener("keydown", widget, true);
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(useWorkspaceState.getState().focusMode).toBe(true);

      document.removeEventListener("keydown", widget, true);
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("does not leave on other keys", () => {
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));

      fireEvent.keyDown(document.body, { key: "Enter" });

      expect(useWorkspaceState.getState().focusMode).toBe(true);
    });

    it("brings the chrome back when the last document is closed, so nobody is left without controls", () => {
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));
      expect(screen.queryByText("Top Bar")).not.toBeInTheDocument();

      act(() => useDocumentStore.setState({ openDocuments: [], activeDocumentId: "" }));

      expect(screen.getByText("Top Bar")).toBeInTheDocument();
    });

    it("does not switch itself back on after it stopped applying (no document, then a new one)", () => {
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));

      act(() => useDocumentStore.setState({ openDocuments: [], activeDocumentId: "" }));
      expect(useWorkspaceState.getState().focusMode).toBe(false);

      act(() => useDocumentStore.getState().newDocument("# Fresh"));
      expect(screen.getByText("Top Bar")).toBeInTheDocument();
    });

    it("is off, with the chrome showing, when Settings is closed again", async () => {
      const user = userEvent.setup();
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));

      await runFromPalette(user, "settings");
      expect(await screen.findByRole("heading", { name: "Settings", level: 2 })).toBeInTheDocument();
      expect(useWorkspaceState.getState().focusMode).toBe(false);

      await user.click(screen.getByRole("button", { name: "Back to editor" }));

      expect(screen.getByText("Top Bar")).toBeInTheDocument();
    });

    it("turns off when the Tour starts, since the Tour points at the chrome Focus hides", async () => {
      const user = userEvent.setup();
      render(<App />);
      await hydrated();
      act(() => useWorkspaceState.getState().setFocusMode(true));
      expect(screen.queryByText("Top Bar")).not.toBeInTheDocument();

      await runFromPalette(user, "take the tour");

      await waitFor(() => expect(useWorkspaceState.getState().focusMode).toBe(false));
      expect(screen.getByText("Top Bar")).toBeInTheDocument();
    });

    it("turns off when the view changes to Read", async () => {
      const user = userEvent.setup();
      render(<App />);
      act(() => useWorkspaceState.getState().setFocusMode(true));

      await runFromPalette(user, "read view");

      await waitFor(() => expect(useWorkspaceState.getState().viewMode).toBe("read"));
      expect(useWorkspaceState.getState().focusMode).toBe(false);
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

    it("replays from the command palette for a user who has already seen it", async () => {
      const user = userEvent.setup();
      loadSettingsWithTourVersion(CURRENT_TOUR_VERSION);

      render(<App />);
      await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      const palette = await screen.findByRole("dialog", { name: "Command palette" });
      await user.type(within(palette).getByPlaceholderText("Type a command..."), "take the tour");
      await user.keyboard("{Enter}");

      expect(await screen.findByText("tour is running")).toBeInTheDocument();
    });

    it("starts the tour on a scratch note when accepted, without recording the version yet", async () => {
      const user = userEvent.setup();
      loadSettingsWithTourVersion(0);

      render(<App />);
      await user.click(await screen.findByRole("button", { name: "Start tour" }));

      expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
      expect(await screen.findByText("tour is running")).toBeInTheDocument();
      expect(useDocumentStore.getState().openDocuments.length).toBeGreaterThan(0);
      expect(useSettingsStore.getState().settings.onboarding.tourVersion).toBe(0);
    });

    it.each([
      ["finish", "End tour: finish"],
      ["close or skip", "End tour: skip"],
    ])("records the tour version when the tour ends by %s", async (_how, button) => {
      const user = userEvent.setup();
      loadSettingsWithTourVersion(0);

      render(<App />);
      await user.click(await screen.findByRole("button", { name: "Start tour" }));
      await user.click(await screen.findByRole("button", { name: button }));

      expect(screen.queryByText("tour is running")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
      expect(useSettingsStore.getState().settings.onboarding.tourVersion).toBe(CURRENT_TOUR_VERSION);
      await waitFor(() =>
        expect(invokeMock).toHaveBeenCalledWith(
          "save_settings",
          expect.objectContaining({
            settings: expect.objectContaining({ onboarding: { tourVersion: CURRENT_TOUR_VERSION } }),
          }),
        ),
      );
    });

    it("saves the tour version once even when the tour is ended twice in a row", async () => {
      const user = userEvent.setup();
      loadSettingsWithTourVersion(0);

      render(<App />);
      await user.click(await screen.findByRole("button", { name: "Start tour" }));
      const finish = await screen.findByRole("button", { name: "End tour: finish" });
      invokeMock.mockClear();
      act(() => {
        finish.click();
        finish.click();
      });

      await waitFor(() => expect(invokeMock).toHaveBeenCalledWith("save_settings", expect.anything()));
      expect(invokeMock.mock.calls.filter(([command]) => command === "save_settings")).toHaveLength(1);
    });

    it("ignores the palette's take-the-tour command until the saved settings have loaded", async () => {
      const user = userEvent.setup();
      invokeMock.mockImplementation(() => new Promise(() => {}));

      render(<App />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      const palette = await screen.findByRole("dialog", { name: "Command palette" });
      await user.type(within(palette).getByPlaceholderText("Type a command..."), "take the tour");
      await user.keyboard("{Enter}");

      expect(screen.queryByText("tour is running")).not.toBeInTheDocument();
      expect(invokeMock).not.toHaveBeenCalledWith("save_settings", expect.anything());
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

  describe("what's new after an update", () => {
    const pending = { version: "1.6.0", notes: "## What's Changed\n\n* feat: colour schemes", publishedAt: null };

    beforeEach(() => {
      pendingStore.record = null;
      getCurrentVersionMock.mockReset().mockResolvedValue("1.6.0");
    });

    afterEach(() => {
      pendingStore.record = null;
      // Sticky toasts live in sonner's global store, so one would leak into the next test.
      toast.dismiss();
    });

    it("announces the update once and opens the notes from the toast", async () => {
      // On desktop the notes are rendered by the Rust command; settings must load for the toast to be allowed.
      invokeMock.mockImplementation(async (command: string) => {
        if (command === "load_settings") return createSeenSettings();
        return command === "parse_markdown"
          ? "<h2>What's Changed</h2><ul><li>feat: colour schemes</li></ul>"
          : undefined;
      });
      pendingStore.record = pending;

      render(<App />);
      expect((await screen.findAllByText("Updated to 1.6.0")).length).toBeGreaterThan(0);
      expect(pendingStore.record).toBeNull();

      // fireEvent: sonner's stylesheet leaves its toasts non-interactive for user-event in jsdom.
      fireEvent.click(screen.getByRole("button", { name: "What's new" }));
      expect(await screen.findByRole("dialog", { name: "What's new in 1.6.0" })).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: "What's Changed" })).toBeInTheDocument();
    });

    it("stays silent when the saved version is not the running one", async () => {
      pendingStore.record = { ...pending, version: "1.5.0" };

      render(<App />);
      await waitFor(() => expect(getCurrentVersionMock).toHaveBeenCalled());

      expect(screen.queryByText(/^Updated to/)).not.toBeInTheDocument();
    });

    it("waits while the Tour prompt is open, then announces once it is dealt with", async () => {
      const user = userEvent.setup();
      const stored = createSeenSettings();
      stored.onboarding.tourVersion = 0;
      invokeMock.mockImplementation(async (command: string) => (command === "load_settings" ? stored : undefined));
      pendingStore.record = pending;

      render(<App />);
      const prompt = await screen.findByRole("dialog", { name: "Take a quick tour?" });
      await act(async () => {});
      expect(screen.queryByText("Updated to 1.6.0")).not.toBeInTheDocument();
      expect(pendingStore.record).toEqual(pending);

      await user.click(within(prompt).getByRole("button", { name: "Skip" }));

      expect((await screen.findAllByText("Updated to 1.6.0")).length).toBeGreaterThan(0);
    });

    it("waits while Focus is on, then announces", async () => {
      useWorkspaceState.setState({ focusMode: true });
      pendingStore.record = pending;

      render(<App />);
      await act(async () => {});
      expect(screen.queryByText("Updated to 1.6.0")).not.toBeInTheDocument();

      act(() => useWorkspaceState.setState({ focusMode: false }));

      expect((await screen.findAllByText("Updated to 1.6.0")).length).toBeGreaterThan(0);
    });
  });
});