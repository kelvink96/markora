import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { SplitPane } from "./components/SplitPane";
import { Toolbar } from "./components/Toolbar";
import { useDocumentStore } from "./store/document";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { setContent, setFilePath, markClean, newDocument } = useDocumentStore();

  const handleOpen = useCallback(async () => {
    // `open()` is a native dialog, not an HTML file input, so it feels like a desktop app.
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });

    if (typeof selected === "string") {
      // The frontend never reads the file directly; it asks Rust to do it through a command.
      const text = await invoke<string>("read_file", { path: selected });
      setContent(text);
      setFilePath(selected);
      // Opening from disk should leave the document in a "clean" state until the next edit.
      markClean();
    }
  }, [markClean, setContent, setFilePath]);

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
    const { isDirty } = useDocumentStore.getState();

    // Guard against discarding unsaved edits when starting a fresh document.
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    newDocument();
  }, [newDocument]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Support both Windows/Linux Ctrl shortcuts and macOS Command shortcuts.
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      if (event.key === "n") {
        event.preventDefault();
        void handleNew();
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
  }, [handleNew, handleOpen, handleSave, handleSaveAs]);

  const { isDirty, filePath } = useDocumentStore();

  return (
    // Theme is represented as a CSS class so the rest of the UI can switch tokens declaratively.
    <div className={`app ${theme}`}>
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        theme={theme}
        isDirty={isDirty}
        filePath={filePath}
      />
      <SplitPane left={<Editor theme={theme} />} right={<Preview />} />
    </div>
  );
}
