import { create } from "zustand";
import { defaultNewDocumentTemplate } from "../features/settings/settings-schema";

export function getUntitledStarterContent() {
  return defaultNewDocumentTemplate;
}

export const untitledStarterContent = getUntitledStarterContent();

export interface DocumentTab {
  id: string;
  content: string;
  filePath: string | null;
  isDirty: boolean;
  handle?: FileSystemFileHandle;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  documents: DocumentTab[];
  activeDocumentId: string;
}

export interface RecentDocumentEntry {
  projectId: string;
  documentId: string;
  filePath: string | null;
  title: string;
  lastOpenedAt: number;
}

export interface ImportedWorkspaceProject {
  name: string;
  documents: Array<Partial<Omit<DocumentTab, "id">>>;
  activeDocumentId?: string;
}

const emptyDocumentState = {
  activeDocumentId: "",
  content: "",
  filePath: null,
  isDirty: false,
  openDocuments: [] as DocumentTab[],
} as const;

interface DocumentStore {
  // Backward-compatible active document fields used across the current app.
  content: string;
  filePath: string | null;
  isDirty: boolean;
  openDocuments: DocumentTab[];
  activeDocumentId: string;
  projects: WorkspaceProject[];
  activeProjectId: string;
  recentDocuments: RecentDocumentEntry[];
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  markClean: () => void;
  newDocument: (content?: string) => void;
  addDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  openDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  selectDocument: (id: string) => void;
  closeDocument: (id: string) => void;
  closeAllDocuments: () => void;
  createProject: (name?: string) => string;
  selectProject: (id: string) => void;
  importProject: (project: ImportedWorkspaceProject) => string;
  hydrateWorkspace: (workspace: {
    projects: WorkspaceProject[];
    activeProjectId: string;
    recentDocuments: RecentDocumentEntry[];
  }) => void;
}

function createDocumentId(existingDocuments: DocumentTab[]) {
  const highestId = existingDocuments.reduce((maxId, document) => {
    const match = /^document-(\d+)$/.exec(document.id);
    if (!match) return maxId;

    return Math.max(maxId, Number(match[1]));
  }, 0);

  return `document-${highestId + 1}`;
}

function createProjectId(existingProjects: WorkspaceProject[]) {
  const highestId = existingProjects.reduce((maxId, project) => {
    const match = /^project-(\d+)$/.exec(project.id);
    if (!match) return maxId;

    return Math.max(maxId, Number(match[1]));
  }, 0);

  return `project-${highestId + 1}`;
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

function createProject(
  existingProjects: WorkspaceProject[],
  name?: string,
  initialDocument?: DocumentTab,
): WorkspaceProject {
  const firstDocument = initialDocument ?? createDocumentTab([]);
  const projectId = createProjectId(existingProjects);

  return {
    id: projectId,
    name: name?.trim() || `Project ${existingProjects.length + 1}`,
    documents: [firstDocument],
    activeDocumentId: firstDocument.id,
  };
}

function createImportedProject(
  existingProjects: WorkspaceProject[],
  project: ImportedWorkspaceProject,
): WorkspaceProject {
  const documents =
    project.documents.length > 0
      ? project.documents.map((document, index) => ({
          id: `document-${index + 1}`,
          content: document.content ?? getUntitledStarterContent(),
          filePath: document.filePath ?? null,
          isDirty: document.isDirty ?? false,
          handle: document.handle,
        }))
      : [createUntitledDocument()];
  const activeDocumentId =
    documents.find((document) => document.id === project.activeDocumentId)?.id ?? documents[0].id;

  return {
    id: createProjectId(existingProjects),
    name: project.name.trim() || `Project ${existingProjects.length + 1}`,
    documents,
    activeDocumentId,
  };
}

function sameDocuments(left: DocumentTab[], right: DocumentTab[]) {
  return (
    left.length === right.length &&
    left.every((document, index) => {
      const other = right[index];
      return (
        document.id === other?.id &&
        document.content === other.content &&
        document.filePath === other.filePath &&
        document.isDirty === other.isDirty
      );
    })
  );
}

function deriveDocumentTitle(document: Pick<DocumentTab, "filePath" | "content">) {
  if (document.filePath) {
    const parts = document.filePath.split(/[\\/]/);
    return parts[parts.length - 1] || "Untitled";
  }

  const firstMeaningfulLine = document.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstMeaningfulLine?.replace(/^#+\s*/, "") || "Untitled";
}

function recordRecent(
  recentDocuments: RecentDocumentEntry[],
  projectId: string,
  document: DocumentTab,
) {
  const nextEntry: RecentDocumentEntry = {
    projectId,
    documentId: document.id,
    filePath: document.filePath,
    title: deriveDocumentTitle(document),
    lastOpenedAt: Date.now(),
  };

  return [
    nextEntry,
    ...recentDocuments.filter(
      (entry) => !(entry.projectId === projectId && entry.documentId === document.id),
    ),
  ];
}

function syncActiveProjectView(
  projects: WorkspaceProject[],
  activeProjectId: string,
  recentDocuments: RecentDocumentEntry[],
) {
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  if (!activeProject) {
    return {
      projects,
      activeProjectId,
      recentDocuments,
      ...emptyDocumentState,
    };
  }

  const activeDocument =
    activeProject.documents.find((document) => document.id === activeProject.activeDocumentId) ??
    activeProject.documents[0];

  if (!activeDocument) {
    return {
      projects,
      activeProjectId: activeProject.id,
      recentDocuments,
      ...emptyDocumentState,
    };
  }

  return {
    projects,
    activeProjectId: activeProject.id,
    recentDocuments,
    openDocuments: activeProject.documents,
    activeDocumentId: activeDocument.id,
    content: activeDocument.content,
    filePath: activeDocument.filePath,
    isDirty: activeDocument.isDirty,
  };
}

function normalizeState(state: DocumentStore) {
  let projects = state.projects;
  let activeProjectId = state.activeProjectId;

  if (projects.length === 0) {
    const initialDocument =
      state.openDocuments[0] ??
      (state.activeDocumentId || state.content || state.filePath || state.isDirty
        ? {
            id: state.activeDocumentId || "document-1",
            content: state.content || getUntitledStarterContent(),
            filePath: state.filePath,
            isDirty: state.isDirty,
          }
        : createUntitledDocument());

    const initialProject = createProject([], "Project 1", initialDocument);
    projects = [initialProject];
    activeProjectId = initialProject.id;
  }

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  if (!activeProject) {
    return syncActiveProjectView(projects, activeProjectId, state.recentDocuments);
  }

  const nextDocuments = state.openDocuments;
  const shouldSyncDocuments =
    nextDocuments.length === 0 ? activeProject.documents.length > 0 : !sameDocuments(activeProject.documents, nextDocuments);
  const shouldSyncActiveDocument =
    state.activeDocumentId !== activeProject.activeDocumentId &&
    (nextDocuments.length === 0 || nextDocuments.some((document) => document.id === state.activeDocumentId));

  if (shouldSyncDocuments || shouldSyncActiveDocument) {
    projects = projects.map((project) =>
      project.id === activeProject.id
        ? {
            ...project,
            documents: nextDocuments,
            activeDocumentId:
              nextDocuments.length === 0
                ? ""
                : nextDocuments.some((document) => document.id === state.activeDocumentId)
                  ? state.activeDocumentId
                  : nextDocuments[0].id,
          }
        : project,
    );
  }

  return syncActiveProjectView(projects, activeProject.id, state.recentDocuments);
}

const initialDocument = createUntitledDocument();
const initialProject: WorkspaceProject = {
  id: "project-1",
  name: "Project 1",
  documents: [initialDocument],
  activeDocumentId: initialDocument.id,
};

export const useDocumentStore = create<DocumentStore>()((set, get) => ({
  content: initialDocument.content,
  filePath: initialDocument.filePath,
  isDirty: initialDocument.isDirty,
  openDocuments: [initialDocument],
  activeDocumentId: initialDocument.id,
  projects: [initialProject],
  activeProjectId: initialProject.id,
  recentDocuments: [],
  setContent: (content) =>
    set((state) => {
      const normalized = normalizeState(state);
      const openDocuments = normalized.openDocuments.map((document) =>
        document.id === normalized.activeDocumentId ? { ...document, content, isDirty: true } : document,
      );
      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: normalized.activeDocumentId }
          : project,
      );

      return syncActiveProjectView(projects, normalized.activeProjectId, normalized.recentDocuments);
    }),
  setFilePath: (filePath) =>
    set((state) => {
      const normalized = normalizeState(state);
      const openDocuments = normalized.openDocuments.map((document) =>
        document.id === normalized.activeDocumentId ? { ...document, filePath } : document,
      );
      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: normalized.activeDocumentId }
          : project,
      );

      return syncActiveProjectView(projects, normalized.activeProjectId, normalized.recentDocuments);
    }),
  markClean: () =>
    set((state) => {
      const normalized = normalizeState(state);
      const openDocuments = normalized.openDocuments.map((document) =>
        document.id === normalized.activeDocumentId ? { ...document, isDirty: false } : document,
      );
      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: normalized.activeDocumentId }
          : project,
      );

      return syncActiveProjectView(projects, normalized.activeProjectId, normalized.recentDocuments);
    }),
  newDocument: (content) =>
    set((state) => {
      const normalized = normalizeState(state);
      const newDocument = createDocumentTab(normalized.openDocuments, { content });
      const openDocuments = [...normalized.openDocuments, newDocument];
      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: newDocument.id }
          : project,
      );
      const recentDocuments = recordRecent(normalized.recentDocuments, normalized.activeProjectId, newDocument);

      return syncActiveProjectView(projects, normalized.activeProjectId, recentDocuments);
    }),
  addDocument: (document = {}) => {
    const normalized = normalizeState(get());
    const newDocument = createDocumentTab(normalized.openDocuments, document);

    set((state) => {
      const current = normalizeState(state);
      const openDocuments = [...current.openDocuments, newDocument];
      const projects = current.projects.map((project) =>
        project.id === current.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: newDocument.id }
          : project,
      );
      const recentDocuments = recordRecent(current.recentDocuments, current.activeProjectId, newDocument);

      return syncActiveProjectView(projects, current.activeProjectId, recentDocuments);
    });

    return newDocument.id;
  },
  openDocument: (document = {}): string => {
    const normalized = normalizeState(get());
    const targetPath = document.filePath ?? null;

    if (!targetPath) {
      return get().addDocument(document);
    }

    for (const project of normalized.projects) {
      const existingDocument = project.documents.find((openDocument) => openDocument.filePath === targetPath);
      if (!existingDocument) {
        continue;
      }

      set((state) => {
        const current = normalizeState(state);
        const projects = current.projects.map((candidateProject) => {
          if (candidateProject.id !== project.id) {
            return candidateProject;
          }

          const documents = candidateProject.documents.map((openDocument) =>
            openDocument.id === existingDocument.id
              ? {
                  ...openDocument,
                  content: document.content ?? openDocument.content,
                  isDirty: document.isDirty ?? openDocument.isDirty,
                }
              : openDocument,
          );

          return {
            ...candidateProject,
            documents,
            activeDocumentId: existingDocument.id,
          };
        });

        const updatedProject = projects.find((candidateProject) => candidateProject.id === project.id);
        const updatedDocument =
          updatedProject?.documents.find((openDocument) => openDocument.id === existingDocument.id) ?? existingDocument;
        const recentDocuments = recordRecent(current.recentDocuments, project.id, updatedDocument);

        return syncActiveProjectView(projects, project.id, recentDocuments);
      });

      return existingDocument.id;
    }

    return get().addDocument(document);
  },
  selectDocument: (id) =>
    set((state) => {
      const normalized = normalizeState(state);
      if (!id) {
        return normalized;
      }

      const document = normalized.openDocuments.find((candidate) => candidate.id === id);
      if (!document) {
        return normalized;
      }

      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId ? { ...project, activeDocumentId: id } : project,
      );
      const recentDocuments = recordRecent(normalized.recentDocuments, normalized.activeProjectId, document);

      return syncActiveProjectView(projects, normalized.activeProjectId, recentDocuments);
    }),
  closeDocument: (id) =>
    set((state) => {
      const normalized = normalizeState(state);
      if (normalized.openDocuments.length === 0) {
        return normalized;
      }

      const closingIndex = normalized.openDocuments.findIndex((document) => document.id === id);
      if (closingIndex === -1) {
        return normalized;
      }

      const openDocuments = normalized.openDocuments.filter((document) => document.id !== id);
      const nextActiveDocumentId =
        openDocuments.length === 0
          ? ""
          : normalized.activeDocumentId === id
            ? (openDocuments[Math.max(0, closingIndex - 1)] ?? openDocuments[0]).id
            : normalized.activeDocumentId;

      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: openDocuments, activeDocumentId: nextActiveDocumentId }
          : project,
      );
      const recentDocuments = normalized.recentDocuments.filter(
        (entry) => !(entry.projectId === normalized.activeProjectId && entry.documentId === id),
      );

      return syncActiveProjectView(projects, normalized.activeProjectId, recentDocuments);
    }),
  closeAllDocuments: () =>
    set((state) => {
      const normalized = normalizeState(state);
      const projects = normalized.projects.map((project) =>
        project.id === normalized.activeProjectId
          ? { ...project, documents: [], activeDocumentId: "" }
          : project,
      );
      const recentDocuments = normalized.recentDocuments.filter(
        (entry) => entry.projectId !== normalized.activeProjectId,
      );

      return syncActiveProjectView(projects, normalized.activeProjectId, recentDocuments);
    }),
  createProject: (name) => {
    const normalized = normalizeState(get());
    const nextProject = createProject(normalized.projects, name);

    set((state) => {
      const current = normalizeState(state);
      const projects = [...current.projects, nextProject];
      const recentDocuments = recordRecent(current.recentDocuments, nextProject.id, nextProject.documents[0]);

      return syncActiveProjectView(projects, nextProject.id, recentDocuments);
    });

    return nextProject.id;
  },
  selectProject: (id) =>
    set((state) => {
      const normalized = normalizeState(state);
      if (!normalized.projects.some((project) => project.id === id)) {
        return normalized;
      }

      return syncActiveProjectView(normalized.projects, id, normalized.recentDocuments);
    }),
  importProject: (project) => {
    const normalized = normalizeState(get());
    const nextProject = createImportedProject(normalized.projects, project);

    set((state) => {
      const current = normalizeState(state);
      const projects = [...current.projects, nextProject];
      const activeDocument =
        nextProject.documents.find((document) => document.id === nextProject.activeDocumentId) ??
        nextProject.documents[0];
      const recentDocuments = activeDocument
        ? recordRecent(current.recentDocuments, nextProject.id, activeDocument)
        : current.recentDocuments;

      return syncActiveProjectView(projects, nextProject.id, recentDocuments);
    });

    return nextProject.id;
  },
  hydrateWorkspace: (workspace) =>
    set(() =>
      syncActiveProjectView(
        workspace.projects.length > 0 ? workspace.projects : [initialProject],
        workspace.activeProjectId,
        workspace.recentDocuments,
      ),
    ),
}));
