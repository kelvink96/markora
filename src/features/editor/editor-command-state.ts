import { create } from "zustand";
import type { MarkdownToolbarAction } from "./markdown-toolbar-actions";

export type EditorEditAction = "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll" | "find" | "replace";

interface EditorCommandState {
  runToolbarAction: (action: MarkdownToolbarAction) => void;
  runEditAction: (action: EditorEditAction) => Promise<void>;
  /** Moves the cursor to the start of a (1-based) line and scrolls it into view. */
  goToLine: (line: number) => void;
  /** Puts the keyboard focus in the editor. */
  focusEditor: () => void;
  /** Moves the section of the nth heading to just before the mth heading (the document's end when m is the heading count). */
  moveSection: (fromIndex: number, slot: number) => void;
  setRunToolbarAction: (handler: (action: MarkdownToolbarAction) => void) => void;
  setMoveSection: (handler: (fromIndex: number, slot: number) => void) => void;
  setFocusEditor: (handler: () => void) => void;
  setGoToLine: (handler: (line: number) => void) => void;
  setRunEditAction: (handler: (action: EditorEditAction) => Promise<void> | void) => void;
}

export const useEditorCommandState = create<EditorCommandState>((set) => ({
  runToolbarAction: () => {},
  runEditAction: async () => {},
  goToLine: () => {},
  setGoToLine: (goToLine) => set({ goToLine }),
  focusEditor: () => {},
  setFocusEditor: (focusEditor) => set({ focusEditor }),
  moveSection: () => {},
  setMoveSection: (moveSection) => set({ moveSection }),
  setRunToolbarAction: (runToolbarAction) => set({ runToolbarAction }),
  setRunEditAction: (runEditAction) => set({ runEditAction: async (action) => runEditAction(action) }),
}));
