import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { createDefaultSettings } from "./features/settings/settings-schema";
import { useDocumentStore } from "./store/document";
import { useSettingsStore } from "./features/settings/settings-store";
import { useThemeStore } from "./features/theme/theme-store";
import { useWorkspaceState } from "./features/workspace/workspace-state";

const {
  loadWorkspaceSnapshotMock,
  saveWorkspaceSnapshotMock,
  openDirectoryMock,
  writeWorkspaceFileMock,
  importFilesMock,
  exportFileMock,
  supportsDirectoryAccessMock,
  supportsFileImportMock,
  supportsFileExportMock,
  installPromptMock,
  installUserChoiceMock,
} = vi.hoisted(() => ({
  loadWorkspaceSnapshotMock: vi.fn(),
  saveWorkspaceSnapshotMock: vi.fn(),
  openDirectoryMock: vi.fn(),
  writeWorkspaceFileMock: vi.fn(),
  importFilesMock: vi.fn(),
  exportFileMock: vi.fn(),
  supportsDirectoryAccessMock: vi.fn(),
  supportsFileImportMock: vi.fn(),
  supportsFileExportMock: vi.fn(),
  installPromptMock: vi.fn(),
  installUserChoiceMock: Promise.resolve({ outcome: "accepted", platform: "web" }),
}));

vi.mock("./platform/runtime", () => ({
  detectPlatform: () => "web",
}));

vi.mock("./platform/files", () => ({
  getFileAdapter: () => ({
    pickOpenPath: vi.fn(),
    pickSavePath: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    writeWorkspaceFile: writeWorkspaceFileMock,
    supportsDirectoryAccess: supportsDirectoryAccessMock,
    supportsFileImport: supportsFileImportMock,
    supportsFileExport: supportsFileExportMock,
    openDirectory: openDirectoryMock,
    importFiles: importFilesMock,
    exportFile: exportFileMock,
  }),
}));

vi.mock("./platform/persistence/web", () => ({
  loadWorkspaceSnapshot: loadWorkspaceSnapshotMock,
  saveWorkspaceSnapshot: saveWorkspaceSnapshotMock,
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
  Workspace: ({
    sidebar,
    left,
    right,
  }: {
    sidebar: React.ReactNode;
    left: React.ReactNode;
    right: React.ReactNode;
  }) => (
    <div>
      {sidebar}
      {left}
      {right}
    </div>
  ),
}));

vi.mock("./components/editor-page/top-bar", () => ({
  TopBar: ({
    onSave,
    canInstallApp,
    onInstallApp,
  }: {
    onSave: () => void;
    canInstallApp?: boolean;
    onInstallApp?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onSave}>
        save
      </button>
      {canInstallApp ? (
        <button type="button" onClick={onInstallApp}>
          Install app
        </button>
      ) : null}
      <div>Top Bar</div>
    </div>
  ),
}));

vi.mock("./components/editor-page/footer-status-bar", () => ({
  FooterStatusBar: () => <div>Footer Status</div>,
}));

vi.mock("./components/editor-page/tab-strip", () => ({
  TabStrip: () => <div>Tab Strip</div>,
}));

describe("App web mode", () => {
  beforeEach(() => {
    const settings = createDefaultSettings();
    useDocumentStore.setState({
      projects: [
        {
          id: "project-1",
          name: "Project 1",
          documents: [{ id: "document-1", content: settings.authoring.newDocumentTemplate, filePath: null, isDirty: false }],
          activeDocumentId: "document-1",
        },
      ],
      activeProjectId: "project-1",
      openDocuments: [{ id: "document-1", content: settings.authoring.newDocumentTemplate, filePath: null, isDirty: false }],
      activeDocumentId: "document-1",
      content: settings.authoring.newDocumentTemplate,
      filePath: null,
      isDirty: false,
      recentDocuments: [],
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
    loadWorkspaceSnapshotMock.mockResolvedValue(null);
    saveWorkspaceSnapshotMock.mockResolvedValue(undefined);
    openDirectoryMock.mockReset();
    writeWorkspaceFileMock.mockReset();
    importFilesMock.mockReset();
    exportFileMock.mockReset();
    supportsDirectoryAccessMock.mockReturnValue(true);
    supportsFileImportMock.mockReturnValue(true);
    supportsFileExportMock.mockReturnValue(true);
    installPromptMock.mockReset();
  });

  it("hydrates the workspace from saved browser state", async () => {
    loadWorkspaceSnapshotMock.mockResolvedValue({
      version: 1,
      projects: [
        {
          id: "project-9",
          name: "Restored",
          documents: [{ id: "document-5", content: "# Restored", filePath: "restored.md", isDirty: false }],
          activeDocumentId: "document-5",
        },
      ],
      activeProjectId: "project-9",
      recentDocuments: [],
    });

    render(<App />);

    await waitFor(() => expect(useDocumentStore.getState().activeProjectId).toBe("project-9"));
    expect(useDocumentStore.getState().content).toBe("# Restored");
  });

  it("imports a folder as a project when the user opens a directory", async () => {
    const user = userEvent.setup();
    openDirectoryMock.mockResolvedValue({
      name: "Workspace",
      files: [
        { name: "notes.md", path: "notes.md", content: "# Notes" },
        { name: "todo.md", path: "nested/todo.md", content: "- [ ] Ship" },
      ],
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open folder" }));

    await waitFor(() =>
      expect(useDocumentStore.getState().projects.some((project) => project.name === "Workspace")).toBe(true),
    );
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
  });

  it("saves a folder-backed document through its file handle", async () => {
    const user = userEvent.setup();
    const handle = {
      kind: "file",
      name: "notes.md",
      getFile: vi.fn(),
      createWritable: vi.fn(),
    } as unknown as FileSystemFileHandle;
    openDirectoryMock.mockResolvedValue({
      name: "Workspace",
      files: [{ name: "notes.md", path: "notes.md", content: "# Notes", handle }],
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open folder" }));
    await waitFor(() => expect(useDocumentStore.getState().openDocuments).toHaveLength(1));

    useDocumentStore.getState().setContent("# Updated");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(writeWorkspaceFileMock).toHaveBeenCalledWith(handle, "# Updated"));
  });

  it("imports files when directory access is unavailable", async () => {
    const user = userEvent.setup();
    supportsDirectoryAccessMock.mockReturnValue(false);
    importFilesMock.mockResolvedValue([{ name: "draft.md", path: "draft.md", content: "# Draft" }]);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Import files" }));

    await waitFor(() =>
      expect(useDocumentStore.getState().projects.some((project) => project.name === "draft.md")).toBe(true),
    );
    expect(useDocumentStore.getState().content).toBe("# Draft");
  });

  it("exports the active document when save falls back to browser download", async () => {
    const user = userEvent.setup();
    supportsDirectoryAccessMock.mockReturnValue(false);
    openDirectoryMock.mockResolvedValue(null);
    exportFileMock.mockResolvedValue(undefined);

    render(<App />);

    useDocumentStore.getState().setContent("# Saved to download");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(exportFileMock).toHaveBeenCalledWith("saved-to-download.md", "# Saved to download"));
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("prompts for installation when the browser exposes an install event", async () => {
    const user = userEvent.setup();
    render(<App />);

    const installEvent = new Event("beforeinstallprompt");
    Object.assign(installEvent, {
      prompt: installPromptMock,
      userChoice: installUserChoiceMock,
    });

    window.dispatchEvent(installEvent);

    await waitFor(() => expect(screen.getByRole("button", { name: "Install app" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Install app" }));

    expect(installPromptMock).toHaveBeenCalled();
  });
});
