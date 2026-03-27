import { create } from "zustand";

interface DocumentStore {
  content: string;
  filePath: string | null;
  isDirty: boolean;
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  markClean: () => void;
  newDocument: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  content:
    "# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n",
  filePath: null,
  isDirty: false,
  // Any content edit means the in-memory document has diverged from disk.
  setContent: (content) => set({ content, isDirty: true }),
  // Updating the file path should not by itself imply content changes.
  setFilePath: (filePath) => set({ filePath }),
  markClean: () => set({ isDirty: false }),
  // Reset back to a blank untitled document.
  newDocument: () => set({ content: "", filePath: null, isDirty: false }),
}));
