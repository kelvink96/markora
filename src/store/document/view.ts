import { createProject, createUntitledDocument, getUntitledStarterContent } from "./factories";
import type { DocumentState, DocumentTab, RecentDocumentEntry, WorkspaceProject } from "./types";

const emptyDocumentState = {
  activeDocumentId: "",
  content: "",
  filePath: null,
  isDirty: false,
  openDocuments: [] as DocumentTab[],
} as const;

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

/**
 * Rebuilds the flat "active document" fields (content, filePath, openDocuments, ...)
 * from the projects, so they always describe the active project's active tab.
 */
export function syncActiveProjectView(
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

/**
 * Reconciles the flat active-document fields with the project tree (some callers and
 * tests set one side directly), then returns a consistent view of both.
 */
export function normalizeState(state: DocumentState) {
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
