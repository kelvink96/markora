import { create } from "zustand";
import type { MarkdownToolbarAction } from "./markdown-toolbar-actions";

export type EditorEditAction = "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll" | "find" | "replace";

interface EditorCommandState {
  runToolbarAction: (action: MarkdownToolbarAction) => void;
  runEditAction: (action: EditorEditAction) => Promise<void>;
  /** Moves the cursor to the start of a (1-based) line and scrolls it into view. */
  goToLine: (line: number) => void;
  setRunToolbarAction: (handler: (action: MarkdownToolbarAction) => void) => void;
  setGoToLine: (handler: (line: number) => void) => void;
  setRunEditAction: (handler: (action: EditorEditAction) => Promise<void> | void) => void;
}

export const useEditorCommandState = create<EditorCommandState>((set) => ({
  runToolbarAction: () => {},
  runEditAction: async () => {},
  goToLine: () => {},
  setGoToLine: (goToLine) => set({ goToLine }),
  setRunToolbarAction: (runToolbarAction) => set({ runToolbarAction }),
  setRunEditAction: (runEditAction) => set({ runEditAction: async (action) => runEditAction(action) }),
}));
