import { create } from "zustand";
import type { MarkdownToolbarAction } from "./markdown-toolbar-actions";

export type EditorEditAction = "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll";

interface EditorCommandState {
  runToolbarAction: (action: MarkdownToolbarAction) => void;
  runEditAction: (action: EditorEditAction) => Promise<void>;
  setRunToolbarAction: (handler: (action: MarkdownToolbarAction) => void) => void;
  setRunEditAction: (handler: (action: EditorEditAction) => Promise<void> | void) => void;
}

export const useEditorCommandState = create<EditorCommandState>((set) => ({
  runToolbarAction: () => {},
  runEditAction: async () => {},
  setRunToolbarAction: (runToolbarAction) => set({ runToolbarAction }),
  setRunEditAction: (runEditAction) => set({ runEditAction: async (action) => runEditAction(action) }),
}));
