import { useEffect } from "react";
import { useDocumentStore } from "../../store/document";

interface ShortcutHandlers {
  onNew: () => void;
  onOpen: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onSaveAs: () => void | Promise<void>;
  /** Ctrl/Cmd+K or Ctrl/Cmd+Shift+P. */
  onCommandPalette?: () => void;
  /** Ctrl/Cmd+Shift+F. */
  onToggleFocus?: () => void;
}

/** Global Ctrl/Cmd shortcuts: N, O, S, Shift+S, K / Shift+P (command palette), Shift+F (Focus) and Ctrl+Tab / Ctrl+Shift+Tab tab cycling. */
export function useKeyboardShortcuts({ onNew, onOpen, onSave, onSaveAs, onCommandPalette, onToggleFocus }: ShortcutHandlers) {
  const selectDocument = useDocumentStore((state) => state.selectDocument);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Support both Windows/Linux Ctrl shortcuts and macOS Command shortcuts.
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if ((key === "k" && !event.shiftKey) || (key === "p" && event.shiftKey)) {
        event.preventDefault();
        onCommandPalette?.();
      }

      if (key === "f" && event.shiftKey) {
        event.preventDefault();
        onToggleFocus?.();
      }

      if (event.key === "n") {
        event.preventDefault();
        void onNew();
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
        void onOpen();
      }

      if (event.key === "s" && !event.shiftKey) {
        event.preventDefault();
        void onSave();
      }

      if (event.key === "s" && event.shiftKey) {
        event.preventDefault();
        void onSaveAs();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCommandPalette, onNew, onOpen, onSave, onSaveAs, onToggleFocus, selectDocument]);
}
