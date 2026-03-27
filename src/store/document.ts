import { create } from "zustand";
import { defaultNewDocumentTemplate } from "../features/settings/settings-schema";

export function getUntitledStarterContent() {
  return defaultNewDocumentTemplate;
}

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
  openDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  selectDocument: (id: string) => void;
  closeDocument: (id: string) => void;
}

function createDocumentId(existingDocuments: DocumentTab[]) {
  const highestId = existingDocuments.reduce((maxId, document) => {
    const match = /^document-(\d+)$/.exec(document.id);
    if (!match) return maxId;

    return Math.max(maxId, Number(match[1]));
  }, 0);

  return `document-${highestId + 1}`;
}

function createUntitledDocument(): DocumentTab {
  return {
    id: "document-1",
    content: getUntitledStarterContent(),
    filePath: null,
    isDirty: false,
  };
}

function createDocumentTab(
  existingDocuments: DocumentTab[],
  overrides: Partial<Omit<DocumentTab, "id">> = {},
): DocumentTab {
  return {
    id: createDocumentId(existingDocuments),
    content: overrides.content ?? getUntitledStarterContent(),
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

export const useDocumentStore = create<DocumentStore>()((set, get) => ({
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
      const newDocument = createDocumentTab(state.openDocuments);
      const openDocuments = [...state.openDocuments, newDocument];

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: newDocument.id }),
      };
    }),
  addDocument: (document = {}) => {
    const newDocument = createDocumentTab(get().openDocuments, document);

    set((state) => {
      const openDocuments = [...state.openDocuments, newDocument];

      return {
        openDocuments,
        ...syncActiveDocument({ openDocuments, activeDocumentId: newDocument.id }),
      };
    });

    return newDocument.id;
  },
  openDocument: (document = {}): string => {
    const targetPath = document.filePath ?? null;
    if (!targetPath) {
      return get().addDocument(document);
    }

    const existingDocument = get().openDocuments.find(
      (openDocument: DocumentTab) => openDocument.filePath === targetPath,
    );

    if (existingDocument) {
      set((state) => {
        const openDocuments = state.openDocuments.map((openDocument) =>
          openDocument.id === existingDocument.id
            ? {
                ...openDocument,
                content: document.content ?? openDocument.content,
                isDirty: document.isDirty ?? openDocument.isDirty,
              }
            : openDocument,
        );

        return {
          openDocuments,
          ...syncActiveDocument({ openDocuments, activeDocumentId: existingDocument.id }),
        };
      });

      return existingDocument.id;
    }

    return get().addDocument(document);
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
