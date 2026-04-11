import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import packageJson from "../package.json";
import App from "./App";
import { untitledStarterContent, useDocumentStore } from "./store/document";
import { createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useThemeStore } from "./features/theme/theme-store";

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
    tabStrip,
    commandBar,
    workspace,
    statusBar,
  }: {
    tabStrip: React.ReactNode;
    commandBar: React.ReactNode;
    workspace: React.ReactNode;
    statusBar: React.ReactNode;
  }) => (
    <div>
      {tabStrip}
      {commandBar}
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
  Workspace: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div>
      {left}
      {right}
    </div>
  ),
}));

vi.mock("./components/editor-page/top-bar", () => ({
  TopBar: ({
    onOpenSettings,
    onOpenKeyboardShortcuts,
    onOpenAbout,
    onCloseTab,
  }: {
    onOpenSettings: () => void;
    onOpenKeyboardShortcuts: () => void;
    onOpenAbout: () => void;
    onCloseTab: () => void;
  }) => (
    <div>
      <button type="button" onClick={onOpenSettings}>
        open-settings
      </button>
      <button type="button" onClick={onOpenKeyboardShortcuts}>
        open-shortcuts
      </button>
      <button type="button" onClick={onOpenAbout}>
        open-about
      </button>
      <button type="button" onClick={onCloseTab}>
        close-from-menu
      </button>
      <div>Top Bar</div>
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
    const settings = createDefaultSettings();
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

  it("opens a custom discard dialog for dirty active tabs", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<App />);
    await user.click(screen.getByRole("button", { name: "close-active" }));

    expect(screen.getByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
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

    expect(screen.getByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
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
    const settings = createDefaultSettings();
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
    const settings = createDefaultSettings();
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
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("closes all tabs without confirmation when the unsaved-close setting is disabled", async () => {
    const user = userEvent.setup();
    const settings = createDefaultSettings();
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
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
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
        return createDefaultSettings();
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
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
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
        return createDefaultSettings();
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

    expect(screen.getByRole("heading", { name: "Application" })).toBeInTheDocument();
    expect(screen.queryByText("Top Bar")).not.toBeInTheDocument();
    expect(screen.queryByText("Footer Status")).not.toBeInTheDocument();
    expect(screen.queryByText(/tabs$/)).not.toBeInTheDocument();
  });

  it("opens the keyboard shortcuts dialog from the help menu action", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-shortcuts" }));

    expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\/Cmd \+ N/i)).toBeInTheDocument();
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

    expect(screen.getByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
  });

  it("persists editor settings only after the section save action", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open-settings" }));
    await user.click(screen.getByRole("button", { name: "Editor" }));
    await user.click(screen.getByLabelText("Show line numbers"));

    expect(invokeMock).not.toHaveBeenCalledWith(
      "save_settings",
      expect.objectContaining({
        settings: expect.anything(),
      }),
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(invokeMock).toHaveBeenCalledWith(
      "save_settings",
      expect.objectContaining({
        settings: expect.objectContaining({
          editor: expect.objectContaining({ lineNumbers: true }),
        }),
      }),
    );
  });
});
