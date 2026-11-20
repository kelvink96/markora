import { useCallback, useEffect, useMemo, useState } from "react";
import packageJson from "../package.json";
import { AppShell } from "./app/app-shell";
import {
  useAutosave,
  useCloseConfirmation,
  useDocumentTitle,
  useExport,
  useExternalOpen,
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
import { sectionWordCounts } from "./features/outline/sections";
import { scrollPreviewToHeading } from "./features/outline/scroll-to-heading";
import { useEditorCommandState } from "./features/editor/editor-command-state";
import { OutlinePanel } from "./components/editor-page/outline-panel";
import { resetSettings, saveSettings } from "./features/settings/settings-api";
import { CURRENT_TOUR_VERSION, isTourUnseen } from "./features/settings/settings-schema";
import { initialTourState, shouldOfferTour, tourReducer, type TourEvent } from "./features/tour/tour-state";
import { TourPrompt } from "./components/editor-page/tour-prompt";
import { Tour } from "./components/editor-page/tour";
import { useSettingsStore } from "./features/settings/settings-store";
import { useUpdateCheckOnLaunch } from "./features/updates/use-update-check";
import { useEditorStatusState } from "./features/workspace/editor-status-state";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useDocumentStore } from "./store/document";
import { useThemeStore } from "./features/theme/theme-store";
import { ErrorBanner } from "./components/editor-page/error-banner";
import { CommandPalette } from "./components/editor-page/command-palette";
import { buildAppCommands, buildPaletteCommands, type PaletteContext } from "./features/commands/palette-commands";
import { stepZoom } from "./features/settings/zoom";
import { useUpdateStore } from "./features/updates/update-store";
import { getModifierLabel } from "./features/shortcuts/modifier-label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CONTENT_WIDTH_MEASURE } from "./features/preview/content-width";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFileAdapter } from "./platform/files";
import { getLinkAdapter } from "./platform/links";
import { detectPlatform } from "./platform/runtime";

const DOCS_URL = "https://github.com/kelvink96/markora#readme";
const REPORT_ISSUE_URL = "https://github.com/kelvink96/markora/issues/new";

export default function App() {
  const fileAdapter = useMemo(() => getFileAdapter(), []);
  const isWeb = detectPlatform() === "web";
  const [activeScreen, setActiveScreen] = useState<"workspace" | "settings">("workspace");
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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
  const showSyntax = useWorkspaceState((state) => state.showSyntax);
  const setShowSyntax = useWorkspaceState((state) => state.setShowSyntax);
  const toggleSyntax = useWorkspaceState((state) => state.toggleSyntax);
  const focusMode = useWorkspaceState((state) => state.focusMode);
  const setFocusMode = useWorkspaceState((state) => state.setFocusMode);
  const toggleFocus = useWorkspaceState((state) => state.toggleFocus);
  const showOutline = useWorkspaceState((state) => state.showOutline);
  const toggleOutline = useWorkspaceState((state) => state.toggleOutline);
  const goToLine = useEditorCommandState((state) => state.goToLine);
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);
  const runEditAction = useEditorCommandState((state) => state.runEditAction);
  const settings = useSettingsStore((state) => state.settings);
  const updateStatus = useUpdateStore((state) => state.status);
  const updateVersion = useUpdateStore((state) => state.update?.version ?? null);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const updateAppearance = useSettingsStore((state) => state.updateAppearance);
  const updateEditor = useSettingsStore((state) => state.updateEditor);
  const updateFiles = useSettingsStore((state) => state.updateFiles);
  const updateOnboarding = useSettingsStore((state) => state.updateOnboarding);
  const isSettingsHydrated = useSettingsStore((state) => state.isHydrated);
  const updatePreview = useSettingsStore((state) => state.updatePreview);
  const templateDraft = useSettingsStore((state) => state.templateDraft);
  const setTemplateDraft = useSettingsStore((state) => state.setTemplateDraft);
  const saveTemplateDraft = useSettingsStore((state) => state.saveTemplateDraft);
  const line = useEditorStatusState((state) => state.line);
  const column = useEditorStatusState((state) => state.column);

  const { fileError, clearFileError, handleOpen, handleSave, handleAutosave, handleSaveAs, canSaveInPlace } =
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
  useUpdateCheckOnLaunch();
  useThemeSync();
  useWebWorkspacePersistence(isWeb);
  useDocumentTitle();
  useAutosave({ save: handleAutosave, canSaveInPlace });
  const sessionRestored = useSessionRestore(fileAdapter, !isWeb);
  useExternalOpen(fileAdapter, sessionRestored);

  const handleNew = useCallback(() => {
    newDocument(useSettingsStore.getState().settings.authoring.newDocumentTemplate);
  }, [newDocument]);

  // Focus belongs to Write in an open document; anywhere else the shortcut and the command do nothing.
  const handleToggleFocus = useCallback(() => {
    const { viewMode: mode, focusMode: on } = useWorkspaceState.getState();
    if (activeScreen !== "workspace" || mode !== "write" || useDocumentStore.getState().openDocuments.length === 0) return;

    toggleFocus();
    if (!on) toast("Focus on. Esc to exit.");
  }, [activeScreen, toggleFocus]);

  useKeyboardShortcuts({
    onToggleFocus: handleToggleFocus,
    onNew: handleNew,
    onOpen: handleOpen,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    // The palette acts on the workspace, so it is not offered from the settings screen.
    onCommandPalette: () => {
      if (activeScreen === "workspace") setIsCommandPaletteOpen(true);
    },
  });

  const persistCurrentSettings = useCallback(() => {
    return saveSettings(useSettingsStore.getState().settings).catch((error) =>
      console.error("save_settings failed:", error),
    );
  }, []);

  const [tourState, setTourState] = useState(initialTourState);
  const dispatchTour = useCallback(
    (event: TourEvent) => {
      const next = tourReducer(tourState, event);
      setTourState(next.state);
      // Read the store, not a closure: Escape and the library's own end event can both land
      // before a re-render, and the version only needs recording (and saving) once.
      if (next.recordVersion && isTourUnseen(useSettingsStore.getState().settings)) {
        updateOnboarding({ tourVersion: CURRENT_TOUR_VERSION });
        void persistCurrentSettings();
      }
    },
    [persistCurrentSettings, tourState, updateOnboarding],
  );
  const startTour = useCallback(() => {
    // Before hydration the store holds defaults: recording a version now would be overwritten
    // by (or overwrite) the saved settings.
    if (!useSettingsStore.getState().isHydrated) return;
    // Every Tour stop points at chrome that Focus hides.
    setFocusMode(false);
    // The first Tour stop points at the editor toolbar, which needs an open document.
    useDocumentStore
      .getState()
      .ensureDocumentOpen(useSettingsStore.getState().settings.authoring.newDocumentTemplate);
    dispatchTour("accept");
  }, [dispatchTour, setFocusMode]);

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
  // Derived rather than trusted from the store: if Focus can't apply (no document, another screen, another
  // view) the chrome is back, so there is never a state with no way to get out.
  const focusActive = focusMode && viewMode === "write" && hasOpenDocuments && activeScreen === "workspace";

  // Focus that can't apply (last tab closed, Settings opened) is switched off, not just hidden, so it
  // can't come back by itself the next time a document or the editor screen returns.
  useEffect(() => {
    if (focusMode && !focusActive) setFocusMode(false);
  }, [focusMode, focusActive, setFocusMode]);

  useEffect(() => {
    if (!focusActive) return;

    // The menu used to turn Focus on hands focus back to a button that has just been removed, which
    // would leave it on the page body and typing nowhere. So focus the editor once that has settled.
    const frame = requestAnimationFrame(() => useEditorCommandState.getState().focusEditor());
    return () => cancelAnimationFrame(frame);
  }, [focusActive]);

  useEffect(() => {
    if (!focusActive) return;

    // Esc belongs to whatever is open first (the find bar, slash menu, menus, dialogs prevent default
    // on the Esc they use), so only a bare Esc leaves Focus.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setFocusMode(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focusActive, setFocusMode]);
  const headings = useMemo(() => extractHeadings(content), [content]);
  const sectionWords = useMemo(() => sectionWordCounts(content, headings), [content, headings]);
  const activeHeadingIndex = findActiveHeadingIndex(headings, line);
  const wordCount = getWordCount(content);

  const openExternal = useCallback((url: string) => {
    getLinkAdapter()
      .openExternal(url)
      .catch((error) => console.error("open link failed:", error));
  }, []);

  const commandContext: PaletteContext = {
    modifier: getModifierLabel(),
    hasActiveDocument: hasOpenDocuments,
    viewMode,
    showSyntax,
    focusMode,
    showOutline,
    appearance: settings.appearance,
    editor: settings.editor,
    updatesSupported: !isWeb,
    update: { status: updateStatus, version: updateVersion },
    handlers: {
      onNew: handleNew,
      onOpen: () => void handleOpen(),
      onSave: () => void handleSave(),
      onSaveAs: () => void handleSaveAs(),
      onCloseTab: requestCloseCurrentTab,
      onExportHtml: () => void exportHtml(),
      onExportPdf: () => void exportPdf(),
      onOpenSettings: () => setActiveScreen("settings"),
      onCheckForUpdates: () => {
        setActiveScreen("settings");
        const { status, check } = useUpdateStore.getState();
        // A release that is already found (or downloaded) is shown as it is; only otherwise look again.
        if (status === "available" || status === "downloading" || status === "ready") {
          requestAnimationFrame(() => document.getElementById("settings-updates")?.scrollIntoView?.({ block: "center" }));
        } else {
          void check();
        }
      },
      onToggleTheme: handleThemeToggle,
      onToggleOutline: toggleOutline,
      onViewModeChange: setViewMode,
      onToggleSyntax: toggleSyntax,
      onToggleFocus: handleToggleFocus,
      onFormat: runToolbarAction,
      onEditAction: (action) => void runEditAction(action),
      onOpenShortcuts: () => setIsKeyboardShortcutsOpen(true),
      onOpenReleaseNotes: () => setIsReleaseNotesOpen(true),
      onOpenAbout: () => setIsAboutDialogOpen(true),
      onToggleStatusBar: () => {
        updateAppearance({ showStatusBar: !settings.appearance.showStatusBar });
        void persistCurrentSettings();
      },
      onToggleWordWrap: () => {
        updateEditor({ wordWrap: !settings.editor.wordWrap });
        void persistCurrentSettings();
      },
      onToggleLineNumbers: () => {
        updateEditor({ lineNumbers: !settings.editor.lineNumbers });
        void persistCurrentSettings();
      },
      onSetThemePreference: (preference) => {
        useThemeStore.getState().setThemePreference(preference);
        updateAppearance({ theme: preference });
        void persistCurrentSettings();
      },
      onSetColorScheme: (colorScheme) => {
        updateAppearance({ colorScheme });
        void persistCurrentSettings();
      },
      onZoom: (direction) => {
        updateAppearance(stepZoom(settings.appearance, direction));
        void persistCurrentSettings();
      },
      onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
      onOpenDocs: () => openExternal(DOCS_URL),
      onReportIssue: () => openExternal(REPORT_ISSUE_URL),
      onTakeTour: startTour,
    },
  };

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
      commands={buildAppCommands(commandContext)}
      recentFiles={recentDocuments.slice(0, 8)}
      onOpenRecent={handleOpenRecent}
      onThemeToggle={handleThemeToggle}
      canInstallApp={canInstall}
      onInstallApp={() => void install()}
      updatesSupported={!isWeb}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showSyntax={showSyntax}
      onShowSyntaxChange={setShowSyntax}
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
        onChangeAppearance={(appearance) => {
          updateAppearance(appearance);
          void persistCurrentSettings();
        }}
        onChangeEditor={(editor) => {
          updateEditor(editor);
          void persistCurrentSettings();
        }}
        onChangeFiles={(files) => {
          updateFiles(files);
          void persistCurrentSettings();
        }}
        onChangePreview={(preview) => {
          updatePreview(preview);
          void persistCurrentSettings();
        }}
        onChangeUpdates={() => void persistCurrentSettings()}
        onSaveTemplate={(value) => {
          setTemplateDraft(value);
          saveTemplateDraft();
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
          left={
            // Always rendered, only its width changes, so turning Focus on or off never remounts the editor.
            <div
              className="mx-auto h-full w-full"
              style={focusActive ? { maxWidth: CONTENT_WIDTH_MEASURE[settings.preview.contentWidth] } : undefined}
            >
              <EditorPane
                theme={theme}
                live={viewMode === "write" && !showSyntax}
                focusDim={focusActive && settings.editor.focusDimming}
              />
            </div>
          }
          right={<PreviewPane />}
          viewMode={viewMode}
          sidebar={
            showOutline && !focusActive ? (
              <OutlinePanel
                headings={headings}
                wordCounts={sectionWords}
                // Works in Read too: the editor stays mounted, only hidden.
                onMoveSection={(fromIndex, slot) => useEditorCommandState.getState().moveSection(fromIndex, slot)}
                activeIndex={activeHeadingIndex}
                onClose={toggleOutline}
                onSelect={(heading) => {
                  // Read hides the editor, so there is no cursor to move: only the preview scrolls.
                  const reading = viewMode === "read";
                  if (!reading) goToLine(heading.line);
                  // Below the md breakpoint the outline floats over the editor, so get it out of the way.
                  if (window.matchMedia?.("(max-width: 767px)").matches) toggleOutline();
                  // With synced scrolling the preview follows the editor; otherwise (and always in Read) take it there too.
                  if (reading || !settings.preview.syncScroll) {
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
        header={activeScreen === "workspace" && !focusActive ? header : null}
        toolbar={activeScreen === "workspace" && hasOpenDocuments && !focusActive ? <FormattingBar disabled={viewMode === "read"} /> : null}
        workspace={workspace}
        statusBar={settings.appearance.showStatusBar && activeScreen === "workspace" && hasOpenDocuments && !focusActive ? statusBar : null}
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
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        // Built only while open, so it always reflects the current document, view mode and outline state.
        commands={isCommandPaletteOpen ? buildPaletteCommands(commandContext) : []}
      />
      <TourPrompt
        // Only after the saved settings have loaded, so a returning user never sees it flash.
        open={isSettingsHydrated && activeScreen === "workspace" && shouldOfferTour(settings, tourState)}
        onSkip={() => dispatchTour("skip")}
        onStart={startTour}
      />
      <Tour run={tourState.running} onEnd={dispatchTour} />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}
