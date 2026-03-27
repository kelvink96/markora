import { create } from "zustand";

const untitledStarterContent =
  "# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n\n---\n\n## Quick Start\n\nUse this untitled document to sketch ideas, outlines, or notes before saving.\n\n### Writing Tips\n\n1. Start with a heading structure.\n2. Use lists to break down ideas.\n3. Add code blocks for snippets.\n4. Switch themes when reviewing contrast.\n\n### Sample Checklist\n\n- [ ] Draft the intro\n- [ ] Add key talking points\n- [ ] Review formatting\n- [ ] Save the file\n\n### Notes\n\n> Markora is built for focused writing with a live preview beside your editor.\n\n```ts\nfunction helloMarkora() {\n  return \"Write first, refine later.\";\n}\n```\n\n## Example Outline\n\n### Section One\n\nThis is a larger placeholder block so you can evaluate spacing, rhythm, scrolling, and preview rendering in a more realistic untitled state.\n\n### Section Two\n\nAdd paragraphs, lists, quotes, and code to see how the editor and preview feel with richer content before a document has been saved.\n";

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
  // Seed the editor with some friendly starter content on first launch.
  content: untitledStarterContent,
  filePath: null,
  isDirty: false,
  // Any content edit means the in-memory document has diverged from disk.
  setContent: (content) => set({ content, isDirty: true }),
  // Updating the file path should not by itself imply content changes.
  setFilePath: (filePath) => set({ filePath }),
  markClean: () => set({ isDirty: false }),
  // Reset back to the default untitled starter document.
  newDocument: () => set({ content: untitledStarterContent, filePath: null, isDirty: false }),
}));
