import { useCallback, useMemo, useState } from "react";
import packageJson from "../package.json";
import { AppShell } from "./app/app-shell";
import {
  useAutosave,
  useCloseConfirmation,
  useDocumentTitle,
  useExport,
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
import { FormattingBar } from "./components/editor-page/formatting-toolbar";
import { TopBar } from "./components/editor-page/top-bar";
import { PreviewPane } from "./components/editor-page/preview-pane";
import { SettingsPage } from "./components/settings-page/settings-page";
import { Workspace } from "./components/editor-page/workspace";
import { FooterStatusBar } from "./components/editor-page/footer-status-bar";
import { AppDialogs } from "./components/editor-page/app-dialogs";
import { EmptyWorkspaceState } from "./components/editor-page/empty-workspace-state";
import { getWordCount } from "./features/document/document-actions";
import { extractHeadings, findActiveHeadingIndex } from "./features/outline/extract-headings";
import { scrollPreviewToHeading } from "./features/outline/scroll-to-heading";
import { useEditorCommandState } from "./features/editor/editor-command-state";
import { OutlinePanel } from "./components/editor-page/outline-panel";
import { resetSettings, saveSettings } from "./features/settings/settings-api";
import { createDefaultSettings } from "./features/settings/settings-schema";
import { useSettingsStore } from "./features/settings/settings-store";
import { useEditorStatusState } from "./features/workspace/editor-status-state";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useDocumentStore } from "./store/document";
import { useThemeStore } from "./features/theme/theme-store";
import { ErrorBanner } from "./components/editor-page/error-banner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  const showOutline = useWorkspaceState((state) => state.showOutline);
  const toggleOutline = useWorkspaceState((state) => state.toggleOutline);
  const goToLine = useEditorCommandState((state) => state.goToLine);
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
  const { exportHtml, exportPdf } = useExport(fileAdapter);

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
  const headings = useMemo(() => extractHeadings(content), [content]);
  const activeHeadingIndex = findActiveHeadingIndex(headings, line);
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

  const header = (
    <TopBar
      tabs={activeScreen === "workspace" ? tabStrip : null}
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
      onExportHtml={() => void exportHtml()}
      onExportPdf={() => void exportPdf()}
      showOutline={showOutline}
      onToggleOutline={toggleOutline}
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
          sidebar={
            showOutline ? (
              <OutlinePanel
                headings={headings}
                activeIndex={activeHeadingIndex}
                onClose={toggleOutline}
                onSelect={(heading) => {
                  goToLine(heading.line);
                  // Below the md breakpoint the outline floats over the editor, so get it out of the way.
                  if (window.matchMedia?.("(max-width: 767px)").matches) toggleOutline();
                  // With synced scrolling the preview follows the editor; otherwise take it there too.
                  if (!settings.preview.syncScroll) {
                    scrollPreviewToHeading(heading.index, headings.length);
                  }
                }}
              />
            ) : undefined
          }
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
    <TooltipProvider>
      <ErrorBanner message={fileError} onDismiss={clearFileError} />
      <AppShell
        themeMode={theme}
        colorScheme={settings.appearance.colorScheme}
        header={activeScreen === "workspace" ? header : null}
        toolbar={activeScreen === "workspace" && hasOpenDocuments ? <FormattingBar /> : null}
        workspace={workspace}
        statusBar={settings.appearance.showStatusBar && activeScreen === "workspace" && hasOpenDocuments ? statusBar : null}
      />
      <AppDialogs
        version={packageJson.version}
        pendingCloseRequest={pendingCloseRequest}
        onCancelClose={cancelPendingClose}
        onConfirmClose={confirmPendingClose}
        shortcutsOpen={isKeyboardShortcutsOpen}
        onShortcutsOpenChange={setIsKeyboardShortcutsOpen}
        aboutOpen={isAboutDialogOpen}
        onAboutOpenChange={setIsAboutDialogOpen}
        releaseNotesOpen={isReleaseNotesOpen}
        onReleaseNotesOpenChange={setIsReleaseNotesOpen}
      />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}
