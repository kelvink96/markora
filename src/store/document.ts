import { create } from "zustand";

export const untitledStarterContent =
  "# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n\n---\n\n## Quick Start\n\nUse this untitled document to sketch ideas, outlines, or notes before saving.\n\n### Writing Tips\n\n1. Start with a heading structure.\n2. Use lists to break down ideas.\n3. Add code blocks for snippets.\n4. Switch themes when reviewing contrast.\n\n### Sample Checklist\n\n- [ ] Draft the intro\n- [ ] Add key talking points\n- [ ] Review formatting\n- [ ] Save the file\n\n### Notes\n\n> Markora is built for focused writing with a live preview beside your editor.\n\n```ts\nfunction helloMarkora() {\n  return \"Write first, refine later.\";\n}\n```\n\n## Example Outline\n\n### Section One\n\nThis is a larger placeholder block so you can evaluate spacing, rhythm, scrolling, and preview rendering in a more realistic untitled state.\n\n### Section Two\n\nAdd paragraphs, lists, quotes, and code to see how the editor and preview feel with richer content before a document has been saved.\n";

export interface DocumentTab {
  id: string;
  content: string;
  filePath: string | null;
  isDirty: boolean;
}

interface DocumentStore {
  // Backward-compatible active document fields used across the current app.
  content: string;
  filePath: string | null;
  isDirty: boolean;
  openDocuments: DocumentTab[];
  activeDocumentId: string;
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  markClean: () => void;
  newDocument: () => void;
  addDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  selectDocument: (id: string) => void;
  closeDocument: (id: string) => void;
}

let nextUntitledDocument = 1;

function createDocumentId() {
  nextUntitledDocument += 1;
  return `document-${nextUntitledDocument}`;
}

function createUntitledDocument(): DocumentTab {
  return {
    id: "document-1",
    content: untitledStarterContent,
    filePath: null,
    isDirty: false,
  };
}

function createDocumentTab(overrides: Partial<Omit<DocumentTab, "id">> = {}): DocumentTab {
  return {
    id: createDocumentId(),
    content: overrides.content ?? untitledStarterContent,
    filePath: overrides.filePath ?? null,
    isDirty: overrides.isDirty ?? false,
  };
}

function syncActiveDocument(state: {
  openDocuments: DocumentTab[];
  activeDocumentId: string;
}) {
  const activeDocument =
    state.openDocuments.find((document) => document.id === state.activeDocumentId) ??
    state.openDocuments[0];

  return {
    activeDocumentId: activeDocument.id,
    content: activeDocument.content,
    filePath: activeDocument.filePath,
    isDirty: activeDocument.isDirty,
  };
}

const initialDocument = createUntitledDocument();

export const useDocumentStore = create<DocumentStore>((set) => ({
  content: initialDocument.content,
  filePath: initialDocument.filePath,
  isDirty: initialDocument.isDirty,
  openDocuments: [initialDocument],
  activeDocumentId: initialDocument.id,
  setContent: (content) =>
    set((state) => {
      const openDocuments = state.openDocuments.map((document) =>
        document.id === state.activeDocumentId ? { ...document, content, isDirty: true } : document,
      );

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: state.activeDocumentId }),
      };
    }),
  setFilePath: (filePath) =>
    set((state) => {
      const openDocuments = state.openDocuments.map((document) =>
        document.id === state.activeDocumentId ? { ...document, filePath } : document,
      );

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: state.activeDocumentId }),
      };
    }),
  markClean: () =>
    set((state) => {
      const openDocuments = state.openDocuments.map((document) =>
        document.id === state.activeDocumentId ? { ...document, isDirty: false } : document,
      );

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: state.activeDocumentId }),
      };
    }),
  newDocument: () =>
    set((state) => {
      const newDocument = createDocumentTab();
      const openDocuments = [...state.openDocuments, newDocument];

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: newDocument.id }),
      };
    }),
  addDocument: (document = {}) => {
    const newDocument = createDocumentTab(document);

    set((state) => {
      const openDocuments = [...state.openDocuments, newDocument];

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: newDocument.id }),
      };
    });

    return newDocument.id;
  },
  selectDocument: (id) =>
    set((state) => {
      if (!state.openDocuments.some((document) => document.id === id)) {
        return state;
      }

      return syncActiveDocument({ openDocuments: state.openDocuments, activeDocumentId: id });
    }),
  closeDocument: (id) =>
    set((state) => {
      if (state.openDocuments.length === 1) {
        return state;
      }

      const closingIndex = state.openDocuments.findIndex((document) => document.id === id);
      if (closingIndex === -1) {
        return state;
      }

      const openDocuments = state.openDocuments.filter((document) => document.id !== id);
      const fallbackDocument =
        state.activeDocumentId === id
          ? openDocuments[Math.max(0, closingIndex - 1)] ?? openDocuments[0]
          : openDocuments.find((document) => document.id === state.activeDocumentId) ?? openDocuments[0];

      return {
        openDocuments,
        ...syncActiveDocument({
          openDocuments,
          activeDocumentId: fallbackDocument.id,
        }),
      };
    }),
}));
