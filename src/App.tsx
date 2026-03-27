import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { AppShell } from "./app/app-shell";
import { EditorPane } from "./components/editor-page/editor-pane";
import { TabStrip } from "./components/editor-page/tab-strip";
import { TopBar } from "./components/editor-page/top-bar";
import { PreviewPane } from "./components/editor-page/preview-pane";
import { Workspace } from "./components/editor-page/workspace";
import { FooterStatusBar } from "./components/editor-page/footer-status-bar";
import { getWordCount } from "./features/document/document-actions";
import { useEditorStatusState } from "./features/workspace/editor-status-state";
import { useWorkspaceState } from "./features/workspace/workspace-state";
import { useDocumentStore } from "./store/document";
import { useThemeStore } from "./features/theme/theme-store";

export default function App() {
  const { openDocument, setFilePath, markClean, newDocument, selectDocument, closeDocument } =
    useDocumentStore();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const viewMode = useWorkspaceState((state) => state.viewMode);
  const setViewMode = useWorkspaceState((state) => state.setViewMode);
  const line = useEditorStatusState((state) => state.line);
  const column = useEditorStatusState((state) => state.column);

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
    newDocument();
  }, [newDocument]);

  const handleCloseTab = useCallback(
    (documentId: string) => {
      const { activeDocumentId, isDirty, openDocuments } = useDocumentStore.getState();
      const targetDocument = openDocuments.find((document) => document.id === documentId);
      if (!targetDocument) return;

      const shouldConfirm = documentId === activeDocumentId ? isDirty : targetDocument.isDirty;
      if (shouldConfirm && !window.confirm("Discard unsaved changes?")) return;

      closeDocument(documentId);
    },
    [closeDocument],
  );

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
      onThemeToggle={toggleTheme}
      onNew={handleNew}
      onOpen={handleOpen}
      onSave={handleSave}
      onSaveAs={handleSaveAs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );

  const workspace = (
    <Workspace left={<EditorPane theme={theme} />} right={<PreviewPane />} viewMode={viewMode} />
  );
  const statusBar = (
    <FooterStatusBar wordCount={wordCount} viewMode={viewMode} line={line} column={column} />
  );

  return (
    <AppShell
      theme={theme}
      tabStrip={tabStrip}
      commandBar={commandBar}
      workspace={workspace}
      statusBar={statusBar}
    />
  );
}
