import { create } from "zustand";
import type { MarkdownToolbarAction } from "./markdown-toolbar-actions";

interface EditorCommandState {
  runToolbarAction: (action: MarkdownToolbarAction) => void;
  setRunToolbarAction: (handler: (action: MarkdownToolbarAction) => void) => void;
}

export const useEditorCommandState = create<EditorCommandState>((set) => ({
  runToolbarAction: () => {},
  setRunToolbarAction: (runToolbarAction) => set({ runToolbarAction }),
}));
