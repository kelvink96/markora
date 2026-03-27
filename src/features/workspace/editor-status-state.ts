import { create } from "zustand";

interface EditorStatusState {
  line: number;
  column: number;
  setCursorPosition: (line: number, column: number) => void;
}

export const useEditorStatusState = create<EditorStatusState>((set) => ({
  line: 1,
  column: 1,
  setCursorPosition: (line, column) => set({ line, column }),
}));
