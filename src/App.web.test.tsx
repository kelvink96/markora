import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { CURRENT_TOUR_VERSION, createDefaultSettings } from "./features/settings/settings-schema";
import { __resetSettingsStorageForTests } from "./features/settings/settings-api";
import { useDocumentStore } from "./store/document";
import { useSettingsStore } from "./features/settings/settings-store";
import { useThemeStore } from "./features/theme/theme-store";
import { useWorkspaceState } from "./features/workspace/workspace-state";

function storeTourVersion(tourVersion: number) {
  localStorage.setItem("markora:web-settings", JSON.stringify({ onboarding: { tourVersion } }));
}

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
    tabs,
    commands,
    canInstallApp,
    onInstallApp,
  }: {
    tabs?: React.ReactNode;
    commands: Array<{ id: string; run: () => void }>;
    canInstallApp?: boolean;
    onInstallApp?: () => void;
  }) => {
    const run = (id: string) => () => commands.find((command) => command.id === id)?.run();
    return (
      <div>
        <button type="button" onClick={run("file.open")}>
          open
        </button>
        <button type="button" onClick={run("file.save")}>
          save
        </button>
        {canInstallApp ? (
          <button type="button" onClick={onInstallApp}>
            Install app
          </button>
        ) : null}
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
  TabStrip: () => <div>Tab Strip</div>,
}));

describe("App web mode", () => {
  beforeEach(() => {
    const settings = createDefaultSettings();
    // Browser storage is what web mode loads from. Start as a user who has dealt with the
    // Tour prompt so it stays out of the way; the prompt tests below override this.
    __resetSettingsStorageForTests();
    localStorage.clear();
    storeTourVersion(CURRENT_TOUR_VERSION);
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

  it("offers the Tour prompt to an unseen user and never again after Skip", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    const first = render(<App />);
    await user.click(await screen.findByRole("button", { name: "Skip" }));
    expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("markora:web-settings") ?? "{}")).toMatchObject({
      onboarding: { tourVersion: CURRENT_TOUR_VERSION },
    });
    first.unmount();

    // A fresh launch: the in-memory cache is gone, only browser storage remains.
    __resetSettingsStorageForTests();
    useSettingsStore.setState({ isHydrated: false, settings: createDefaultSettings() });
    render(<App />);
    await waitFor(() => expect(useSettingsStore.getState().isHydrated).toBe(true));

    expect(screen.queryByRole("dialog", { name: "Take a quick tour?" })).not.toBeInTheDocument();
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

  it("imports files when the user opens from the File menu", async () => {
    const user = userEvent.setup();
    supportsFileImportMock.mockReturnValue(true);
    importFilesMock.mockResolvedValue([{ name: "draft.md", path: "draft.md", content: "# Draft" }]);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "open" }));

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
