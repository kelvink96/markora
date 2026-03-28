import { useCallback, useEffect, useState } from "react";
import packageJson from "../package.json";
import { open, save } from "@tauri-apps/plugin-dialog";
import { AppShell } from "./app/app-shell";
import { EditorPane } from "./components/editor-page/editor-pane";
import { TabStrip } from "./components/editor-page/tab-strip";
import { TopBar } from "./components/editor-page/top-bar";
import { PreviewPane } from "./components/editor-page/preview-pane";
import { SettingsPage } from "./components/settings-page/settings-page";
import { Workspace } from "./components/editor-page/workspace";
import { FooterStatusBar } from "./components/editor-page/footer-status-bar";
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
import { invoke } from "@tauri-apps/api/core";

function getSystemThemePreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<"workspace" | "settings">("workspace");
  const [pendingCloseDocumentId, setPendingCloseDocumentId] = useState<string | null>(null);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const { openDocument, setFilePath, markClean, newDocument, selectDocument, closeDocument } =
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

  const persistCurrentSettings = useCallback(() => {
    return saveSettings(useSettingsStore.getState().settings).catch((error) =>
      console.error("save_settings failed:", error),
    );
  }, []);

  const handleOpen = useCallback(async () => {
    // `open()` is a native dialog, not an HTML file input, so it feels like a desktop app.
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });

    if (typeof selected === "string") {
      // The frontend never reads the file directly; it asks Rust to do it through a command.
      const text = await invoke<string>("read_file", { path: selected });
      openDocument({ content: text, filePath: selected, isDirty: false });
    }
  }, [openDocument]);

  const handleSaveAs = useCallback(async () => {
    // getState() gives the latest store snapshot without waiting for React to re-render.
    const { content } = useDocumentStore.getState();
    const savePath = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath: "untitled.md",
    });

    if (savePath) {
      await invoke("write_file", { path: savePath, content });
      setFilePath(savePath);
      markClean();
    }
  }, [markClean, setFilePath]);

  const handleSave = useCallback(async () => {
    // Read from the store directly so save always uses the newest content and file path.
    const { filePath, content } = useDocumentStore.getState();

    if (filePath) {
      await invoke("write_file", { path: filePath, content });
      markClean();
    } else {
      await handleSaveAs();
    }
  }, [handleSaveAs, markClean]);

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
        setPendingCloseDocumentId(documentId);
        return;
      }

      closeDocument(documentId);
    },
    [closeDocument],
  );

  const handleCancelPendingClose = useCallback(() => {
    setPendingCloseDocumentId(null);
  }, []);

  const handleConfirmPendingClose = useCallback(() => {
    if (!pendingCloseDocumentId) {
      return;
    }

    closeDocument(pendingCloseDocumentId);
    setPendingCloseDocumentId(null);
  }, [closeDocument, pendingCloseDocumentId]);

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

  const handleCloseCurrentTab = useCallback(() => {
    const { activeDocumentId } = useDocumentStore.getState();
    handleCloseTab(activeDocumentId);
  }, [handleCloseTab]);

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

  const { openDocuments, activeDocumentId } = useDocumentStore();
  const content = useDocumentStore((state) => state.content);
  const wordCount = getWordCount(content);

  const tabStrip = (
    <TabStrip
      tabs={openDocuments}
      activeTabId={activeDocumentId}
      onSelectTab={selectDocument}
      onCloseTab={handleCloseTab}
      onNewTab={handleNew}
    />
  );

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
      <Workspace left={<EditorPane theme={theme} />} right={<PreviewPane />} viewMode={viewMode} />
    )
  );
  const statusBar = (
    <FooterStatusBar wordCount={wordCount} viewMode={viewMode} line={line} column={column} />
  );

  return (
    <>
      <AppShell
        themeMode={theme}
        colorScheme={settings.appearance.colorScheme}
        tabStrip={activeScreen === "workspace" ? tabStrip : null}
        commandBar={activeScreen === "workspace" ? commandBar : null}
        workspace={workspace}
        statusBar={settings.appearance.showStatusBar && activeScreen === "workspace" ? statusBar : null}
      />
      <Dialog
        open={pendingCloseDocumentId !== null}
        title="Discard unsaved changes?"
        description="This document has unsaved edits. Discard them and close the tab?"
        actions={
          <>
            <Button onClick={handleCancelPendingClose}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmPendingClose}>
              Discard
            </Button>
          </>
        }
      >
        Closing this tab will remove any unsaved changes in the current document.
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
        </div>
      </Dialog>
    </>
  );
}
