import { useCallback, useEffect, useMemo, useState } from "react";
import packageJson from "../package.json";
import { AppShell } from "./app/app-shell";
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
import { loadSettings, resetSettings, saveSettings } from "./features/settings/settings-api";
import { createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useEditorStatusState } from "./features/workspace/editor-status-state";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useDocumentStore } from "./store/document";
import { useThemeStore } from "./features/theme/theme-store";
import { ErrorBanner } from "./components/editor-page/error-banner";
import { getFileAdapter } from "./platform/files";
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "./platform/persistence/web";
import { detectPlatform } from "./platform/runtime";

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function getSystemThemePreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getDocumentExportName(filePath: string | null, content: string) {
  if (filePath) {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || "untitled.md";
  }

  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.replace(/^#+\s*/, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .trim();

  if (!firstMeaningfulLine) {
    return "untitled.md";
  }

  const normalized = firstMeaningfulLine.replace(/\s+/g, "-").toLowerCase();
  return `${normalized || "untitled"}.md`;
}

function getDocumentTitle(filePath: string | null, content: string) {
  return getDocumentExportName(filePath, content).replace(/\.md$/i, "");
}

export default function App() {
  const fileAdapter = useMemo(() => getFileAdapter(), []);
  const isWeb = detectPlatform() === "web";
  const [activeScreen, setActiveScreen] = useState<"workspace" | "settings">("workspace");
  const [pendingCloseRequest, setPendingCloseRequest] = useState<
    { type: "single"; documentId: string } | { type: "all" } | null
  >(null);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<DeferredInstallPromptEvent | null>(null);
  const {
    openDocument,
    setFilePath,
    markClean,
    newDocument,
    projects,
    activeProjectId,
    recentDocuments,
    importProject,
    hydrateWorkspace,
    selectProject,
    selectDocument,
    closeDocument,
    closeAllDocuments,
  } =
    useDocumentStore();
  const theme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme);
  const viewMode = useWorkspaceState((state) => state.viewMode);
  const setViewMode = useWorkspaceState((state) => state.setViewMode);
  const settings = useSettingsStore((state) => state.settings);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const updateAppearance = useSettingsStore((state) => state.updateAppearance);
  const updateEditor = useSettingsStore((state) => state.updateEditor);
  const updateFiles = useSettingsStore((state) => state.updateFiles);
  const templateDraft = useSettingsStore((state) => state.templateDraft);
  const setTemplateDraft = useSettingsStore((state) => state.setTemplateDraft);
  const saveTemplateDraft = useSettingsStore((state) => state.saveTemplateDraft);
  const line = useEditorStatusState((state) => state.line);
  const column = useEditorStatusState((state) => state.column);
  const { openDocuments, activeDocumentId } = useDocumentStore();
  const content = useDocumentStore((state) => state.content);

  const persistCurrentSettings = useCallback(() => {
    return saveSettings(useSettingsStore.getState().settings).catch((error) =>
      console.error("save_settings failed:", error),
    );
  }, []);

  const handleImportFiles = useCallback(async () => {
    if (!fileAdapter.importFiles) {
      return;
    }

    try {
      const files = await fileAdapter.importFiles();
      if (!files || files.length === 0) {
        return;
      }

      importProject({
        name: files.length === 1 ? files[0].name : "Imported files",
        documents: files.map((file) => ({
          content: file.content,
          filePath: file.path,
          isDirty: false,
          handle: file.handle,
        })),
      });
    } catch (error) {
      setFileError("Failed to import files. Please try again.");
      console.error("import files failed:", error);
    }
  }, [fileAdapter, importProject]);

  const exportCurrentDocument = useCallback(async () => {
    if (!fileAdapter.exportFile) {
      return false;
    }

    const { activeDocumentId, content, filePath, openDocuments } = useDocumentStore.getState();
    if (!activeDocumentId) {
      return false;
    }

    const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);
    const exportName = getDocumentExportName(activeDocument?.filePath ?? filePath, content);

    await fileAdapter.exportFile(exportName, content);
    markClean();
    return true;
  }, [fileAdapter, markClean]);

  const handleOpen = useCallback(async () => {
    if (fileAdapter.supportsFileImport() && fileAdapter.importFiles) {
      await handleImportFiles();
      return;
    }

    try {
      const selected = await fileAdapter.pickOpenPath();
      if (selected) {
        const text = await fileAdapter.readFile(selected);
        openDocument({ content: text, filePath: selected, isDirty: false });
      }
    } catch (error) {
      setFileError("Failed to open file. Please try again.");
      console.error("open file failed:", error);
    }
  }, [fileAdapter, handleImportFiles, openDocument]);

  const handleSaveAs = useCallback(async () => {
    const { activeDocumentId, content } = useDocumentStore.getState();
    if (!activeDocumentId) return;

    try {
      if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) {
        await exportCurrentDocument();
        return;
      }

      const savePath = await fileAdapter.pickSavePath("untitled.md");
      if (savePath) {
        await fileAdapter.writeFile(savePath, content);
        setFilePath(savePath);
        markClean();
      }
    } catch (error) {
      setFileError("Failed to save file. Please try again.");
      console.error("save file failed:", error);
    }
  }, [exportCurrentDocument, fileAdapter, markClean, setFilePath]);

  const handleSave = useCallback(async () => {
    const { activeDocumentId, filePath, content, openDocuments } = useDocumentStore.getState();
    if (!activeDocumentId) return;

    try {
      const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);

      if (activeDocument?.handle && fileAdapter.writeWorkspaceFile) {
        await fileAdapter.writeWorkspaceFile(activeDocument.handle, content);
        markClean();
        return;
      }

      if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) {
        await exportCurrentDocument();
        return;
      }

      if (filePath) {
        await fileAdapter.writeFile(filePath, content);
        markClean();
      } else {
        await handleSaveAs();
      }
    } catch (error) {
      setFileError("Failed to save file. Please try again.");
      console.error("save file failed:", error);
    }
  }, [exportCurrentDocument, fileAdapter, handleSaveAs, markClean]);

  const handleNew = useCallback(() => {
    newDocument(useSettingsStore.getState().settings.authoring.newDocumentTemplate);
  }, [newDocument]);

  const handleCloseTab = useCallback(
    (documentId: string) => {
      const { activeDocumentId, isDirty, openDocuments } = useDocumentStore.getState();
      const confirmOnUnsavedClose = useSettingsStore.getState().settings.files.confirmOnUnsavedClose;
      const targetDocument = openDocuments.find((document) => document.id === documentId);
      if (!targetDocument) return;

      const shouldConfirm = documentId === activeDocumentId ? isDirty : targetDocument.isDirty;
      if (shouldConfirm && confirmOnUnsavedClose) {
        setPendingCloseRequest({ type: "single", documentId });
        return;
      }

      closeDocument(documentId);
    },
    [closeDocument],
  );

  const handleCloseAllTabs = useCallback(() => {
    const { openDocuments } = useDocumentStore.getState();
    if (openDocuments.length === 0) {
      return;
    }

    const confirmOnUnsavedClose = useSettingsStore.getState().settings.files.confirmOnUnsavedClose;
    const hasDirtyDocuments = openDocuments.some((document) => document.isDirty);

    if (hasDirtyDocuments && confirmOnUnsavedClose) {
      setPendingCloseRequest({ type: "all" });
      return;
    }

    closeAllDocuments();
  }, [closeAllDocuments]);

  const handleCancelPendingClose = useCallback(() => {
    setPendingCloseRequest(null);
  }, []);

  const handleConfirmPendingClose = useCallback(() => {
    if (!pendingCloseRequest) {
      return;
    }

    if (pendingCloseRequest.type === "all") {
      closeAllDocuments();
    } else {
      closeDocument(pendingCloseRequest.documentId);
    }

    setPendingCloseRequest(null);
  }, [closeAllDocuments, closeDocument, pendingCloseRequest]);

  useEffect(() => {
    let isActive = true;

    loadSettings()
      .then((loadedSettings) => {
        if (!isActive) return;
        hydrateSettings(loadedSettings);
      })
      .catch((error) => console.error("load_settings failed:", error));

    return () => {
      isActive = false;
    };
  }, [hydrateSettings]);

  useEffect(() => {
    let isActive = true;

    if (!isWeb) {
      return;
    }

    loadWorkspaceSnapshot()
      .then((snapshot) => {
        if (!isActive || !snapshot) return;
        hydrateWorkspace(snapshot);
      })
      .catch((error) => console.error("load_workspace_snapshot failed:", error));

    return () => {
      isActive = false;
    };
  }, [hydrateWorkspace, isWeb]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    void saveWorkspaceSnapshot({
      version: 1,
      projects,
      activeProjectId,
      recentDocuments,
    }).catch((error) => console.error("save_workspace_snapshot failed:", error));
  }, [activeProjectId, isWeb, projects, recentDocuments]);

  useEffect(() => {
    setThemePreference(settings.appearance.theme);
  }, [setThemePreference, settings.appearance.theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    setSystemTheme(getSystemThemePreference());
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setSystemTheme]);

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

  const handleCloseCurrentTab = useCallback(() => {
    const { activeDocumentId } = useDocumentStore.getState();
    handleCloseTab(activeDocumentId);
  }, [handleCloseTab]);

  const handleInstallApp = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }

    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } finally {
      setInstallPromptEvent(null);
    }
  }, [installPromptEvent]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Support both Windows/Linux Ctrl shortcuts and macOS Command shortcuts.
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      if (event.key === "n") {
        event.preventDefault();
        void handleNew();
      }

      if (event.key === "Tab") {
        const { openDocuments, activeDocumentId } = useDocumentStore.getState();
        if (openDocuments.length > 1) {
          event.preventDefault();
          const activeIndex = openDocuments.findIndex((document) => document.id === activeDocumentId);
          const offset = event.shiftKey ? -1 : 1;
          const nextIndex = (activeIndex + offset + openDocuments.length) % openDocuments.length;
          selectDocument(openDocuments[nextIndex].id);
        }
      }

      if (event.key === "o") {
        event.preventDefault();
        void handleOpen();
      }

      if (event.key === "s" && !event.shiftKey) {
        event.preventDefault();
        void handleSave();
      }

      if (event.key === "s" && event.shiftKey) {
        event.preventDefault();
        void handleSaveAs();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNew, handleOpen, handleSave, handleSaveAs, selectDocument]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as DeferredInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isWeb]);

  useEffect(() => {
    const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);
    const titleLabel = activeDocument
      ? getDocumentTitle(activeDocument.filePath, activeDocument.content)
      : "Markora";

    document.title = titleLabel === "Markora" ? "Markora" : `${titleLabel} • Markora`;
  }, [activeDocumentId, openDocuments]);

  const hasOpenDocuments = openDocuments.length > 0;
  const wordCount = getWordCount(content);

  const tabStrip = hasOpenDocuments ? (
    <TabStrip
      tabs={openDocuments}
      activeTabId={activeDocumentId}
      onSelectTab={selectDocument}
      onCloseTab={handleCloseTab}
      onCloseAllTabs={handleCloseAllTabs}
      onNewTab={handleNew}
    />
  ) : null;

  const commandBar = (
    <TopBar
      onOpenSettings={() => setActiveScreen("settings")}
      onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
      onOpenAbout={() => setIsAboutDialogOpen(true)}
      onThemeToggle={handleThemeToggle}
      onNew={handleNew}
      onOpen={handleOpen}
      onSave={handleSave}
      onSaveAs={handleSaveAs}
      onCloseTab={handleCloseCurrentTab}
      recentFiles={recentDocuments.slice(0, 8)}
      onOpenRecent={handleOpenRecent}
      canInstallApp={isWeb && installPromptEvent !== null}
      onInstallApp={() => void handleInstallApp()}
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
      <ErrorBanner message={fileError} onDismiss={() => setFileError(null)} />
      <AppShell
        themeMode={theme}
        colorScheme={settings.appearance.colorScheme}
        tabStrip={activeScreen === "workspace" ? tabStrip : null}
        commandBar={activeScreen === "workspace" ? commandBar : null}
        workspace={workspace}
        statusBar={settings.appearance.showStatusBar && activeScreen === "workspace" ? statusBar : null}
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
            <Button onClick={handleCancelPendingClose}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmPendingClose}>
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
    </>
  );
}
