import { useCallback, useMemo, useState } from "react";
import packageJson from "../package.json";
import { AppShell } from "./app/app-shell";
import {
  useAutosave,
  useCloseConfirmation,
  useDocumentTitle,
  useFileOperations,
  useInstallPrompt,
  useKeyboardShortcuts,
  useSessionRestore,
  useSettingsHydration,
  useThemeSync,
  useWebWorkspacePersistence,
} from "./app/hooks";
import { EditorPane } from "./components/editor-page/editor-pane";
import { TabStrip } from "./components/editor-page/tab-strip";
import { TopBar } from "./components/editor-page/top-bar";
import { PreviewPane } from "./components/editor-page/preview-pane";
import { SettingsPage } from "./components/settings-page/settings-page";
import { Workspace } from "./components/editor-page/workspace";
import { FooterStatusBar } from "./components/editor-page/footer-status-bar";
import { EmptyWorkspaceState } from "./components/editor-page/empty-workspace-state";
import { Button } from "./components/shared/button";
import { Dialog } from "./components/shared/dialog";
import { getWordCount } from "./features/document/document-actions";
import { resetSettings, saveSettings } from "./features/settings/settings-api";
import { createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useEditorStatusState } from "./features/workspace/editor-status-state";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useDocumentStore } from "./store/document";
import { useThemeStore } from "./features/theme/theme-store";
import { ErrorBanner } from "./components/editor-page/error-banner";
import { getFileAdapter } from "./platform/files";
import { detectPlatform } from "./platform/runtime";

export default function App() {
  const fileAdapter = useMemo(() => getFileAdapter(), []);
  const isWeb = detectPlatform() === "web";
  const [activeScreen, setActiveScreen] = useState<"workspace" | "settings">("workspace");
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const newDocument = useDocumentStore((state) => state.newDocument);
  const recentDocuments = useDocumentStore((state) => state.recentDocuments);
  const selectProject = useDocumentStore((state) => state.selectProject);
  const selectDocument = useDocumentStore((state) => state.selectDocument);
  const openDocuments = useDocumentStore((state) => state.openDocuments);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const content = useDocumentStore((state) => state.content);
  const theme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const viewMode = useWorkspaceState((state) => state.viewMode);
  const setViewMode = useWorkspaceState((state) => state.setViewMode);
  const settings = useSettingsStore((state) => state.settings);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const updateAppearance = useSettingsStore((state) => state.updateAppearance);
  const updateEditor = useSettingsStore((state) => state.updateEditor);
  const updateFiles = useSettingsStore((state) => state.updateFiles);
  const updatePreview = useSettingsStore((state) => state.updatePreview);
  const templateDraft = useSettingsStore((state) => state.templateDraft);
  const setTemplateDraft = useSettingsStore((state) => state.setTemplateDraft);
  const saveTemplateDraft = useSettingsStore((state) => state.saveTemplateDraft);
  const line = useEditorStatusState((state) => state.line);
  const column = useEditorStatusState((state) => state.column);

  const { fileError, clearFileError, handleOpen, handleSave, handleSaveAs, canSaveInPlace } =
    useFileOperations(fileAdapter);
  const {
    pendingCloseRequest,
    requestCloseTab,
    requestCloseAllTabs,
    requestCloseCurrentTab,
    cancelPendingClose,
    confirmPendingClose,
  } = useCloseConfirmation();
  const { canInstall, install } = useInstallPrompt(isWeb);

  useSettingsHydration();
  useThemeSync();
  useWebWorkspacePersistence(isWeb);
  useDocumentTitle();
  useAutosave({ save: handleSave, canSaveInPlace });
  useSessionRestore(fileAdapter, !isWeb);

  const handleNew = useCallback(() => {
    newDocument(useSettingsStore.getState().settings.authoring.newDocumentTemplate);
  }, [newDocument]);

  useKeyboardShortcuts({
    onNew: handleNew,
    onOpen: handleOpen,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
  });

  const persistCurrentSettings = useCallback(() => {
    return saveSettings(useSettingsStore.getState().settings).catch((error) =>
      console.error("save_settings failed:", error),
    );
  }, []);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    const nextThemePreference = useThemeStore.getState().themePreference;
    updateAppearance({ theme: nextThemePreference });
    void persistCurrentSettings();
  }, [persistCurrentSettings, toggleTheme, updateAppearance]);

  const handleOpenRecent = useCallback((projectId: string, documentId: string) => {
    selectProject(projectId);
    selectDocument(documentId);
  }, [selectProject, selectDocument]);

  const hasOpenDocuments = openDocuments.length > 0;
  const wordCount = getWordCount(content);

  const tabStrip = hasOpenDocuments ? (
    <TabStrip
      tabs={openDocuments}
      activeTabId={activeDocumentId}
      onSelectTab={selectDocument}
      onCloseTab={requestCloseTab}
      onCloseAllTabs={requestCloseAllTabs}
      onNewTab={handleNew}
      onRenameTab={(id) => console.log("rename tab:", id)}
    />
  ) : null;

  const commandBar = (
    <TopBar
      onOpenSettings={() => setActiveScreen("settings")}
      onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
      onOpenAbout={() => setIsAboutDialogOpen(true)}
      onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
      onThemeToggle={handleThemeToggle}
      onNew={handleNew}
      onOpen={handleOpen}
      onSave={handleSave}
      onSaveAs={handleSaveAs}
      onCloseTab={requestCloseCurrentTab}
      recentFiles={recentDocuments.slice(0, 8)}
      onOpenRecent={handleOpenRecent}
      canInstallApp={canInstall}
      onInstallApp={() => void install()}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );

  const workspace = (
    activeScreen === "settings" ? (
      <SettingsPage
        settings={settings}
        templateDraft={templateDraft}
        version={packageJson.version}
        onClose={() => setActiveScreen("workspace")}
        canRestoreSession={!isWeb}
        onSaveAppearance={(appearance) => {
          updateAppearance(appearance);
          void persistCurrentSettings();
        }}
        onSaveEditor={(editor) => {
          updateEditor(editor);
          void persistCurrentSettings();
        }}
        onSaveFiles={(files) => {
          updateFiles(files);
          void persistCurrentSettings();
        }}
        onSavePreview={(preview) => {
          updatePreview(preview);
          void persistCurrentSettings();
        }}
        onSaveTemplate={(value) => {
          setTemplateDraft(value);
          saveTemplateDraft();
          void persistCurrentSettings();
        }}
        onResetTemplate={() => {
          const defaultTemplate = createDefaultSettings().authoring.newDocumentTemplate;
          setTemplateDraft(defaultTemplate);
          useSettingsStore.getState().saveTemplateDraft();
          void persistCurrentSettings();
        }}
        onResetAll={() => {
          void resetSettings()
            .then((defaultSettings) => {
              hydrateSettings(defaultSettings);
            })
            .catch((error) => console.error("reset_settings failed:", error));
        }}
      />
    ) : (
      hasOpenDocuments ? (
        <Workspace
          left={<EditorPane theme={theme} />}
          right={<PreviewPane />}
          viewMode={viewMode}
        />
      ) : (
        <EmptyWorkspaceState
          onNewDocument={handleNew}
          onOpenFile={() => void handleOpen()}
          openFileLabel={fileAdapter.supportsFileImport() ? "Import files" : "Open file"}
        />
      )
    )
  );
  const statusBar = (
    <FooterStatusBar wordCount={wordCount} viewMode={viewMode} line={line} column={column} />
  );

  return (
    <>
      <ErrorBanner message={fileError} onDismiss={clearFileError} />
      <AppShell
        themeMode={theme}
        colorScheme={settings.appearance.colorScheme}
        tabStrip={activeScreen === "workspace" ? tabStrip : null}
        commandBar={activeScreen === "workspace" ? commandBar : null}
        workspace={workspace}
        statusBar={settings.appearance.showStatusBar && activeScreen === "workspace" && hasOpenDocuments ? statusBar : null}
      />
      <Dialog
        open={pendingCloseRequest !== null}
        title="Discard unsaved changes?"
        description={
          pendingCloseRequest?.type === "all"
            ? "Some open documents have unsaved edits. Discard them and close every tab?"
            : "This document has unsaved edits. Discard them and close the tab?"
        }
        actions={
          <>
            <Button onClick={cancelPendingClose}>Cancel</Button>
            <Button variant="danger" onClick={confirmPendingClose}>
              Discard
            </Button>
          </>
        }
      >
        {pendingCloseRequest?.type === "all"
          ? "Closing all tabs will remove any unsaved changes across your open documents."
          : "Closing this tab will remove any unsaved changes in the current document."}
      </Dialog>
      <Dialog
        open={isKeyboardShortcutsOpen}
        title="Keyboard Shortcuts"
        description="Quick shortcuts for the current editor workflow."
        actions={<Button onClick={() => setIsKeyboardShortcutsOpen(false)}>Close</Button>}
      >
        <div className="space-y-2 text-sm text-app-text">
          <p>`Ctrl/Cmd + N` creates a new document.</p>
          <p>`Ctrl/Cmd + O` opens an existing file.</p>
          <p>`Ctrl/Cmd + S` saves the current document.</p>
          <p>`Ctrl/Cmd + Shift + S` opens Save As.</p>
          <p>`Ctrl + Tab` moves to the next tab.</p>
          <p>`Ctrl + Shift + Tab` moves to the previous tab.</p>
        </div>
      </Dialog>
      <Dialog
        open={isAboutDialogOpen}
        title="About Markora"
        description="A desktop-first markdown editor built with Tauri, React, and CodeMirror."
        actions={<Button onClick={() => setIsAboutDialogOpen(false)}>Close</Button>}
      >
        <div className="space-y-2 text-sm text-app-text">
          <p>Version {packageJson.version}</p>
          <p>Markora keeps writing and reading in dedicated modes for a focused markdown workflow.</p>
          <a
            href="https://kelvink96.github.io/markora/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-accent underline"
          >
            Privacy Policy
          </a>
        </div>
      </Dialog>
      <Dialog
        open={isReleaseNotesOpen}
        title="Release Notes"
        description={`Version ${packageJson.version}`}
        actions={<Button onClick={() => setIsReleaseNotesOpen(false)}>Close</Button>}
      >
        <div className="text-sm text-app-text">
          <p>Release notes are available on the releases page.</p>
          <a
            href="https://kelvink96.github.io/markora/versions"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-app-accent underline"
          >
            View all releases
          </a>
        </div>
      </Dialog>
    </>
  );
}
