import { defaultNewDocumentTemplate } from "../../features/settings/settings-schema";
import type {
  DocumentTab,
  ImportedWorkspaceProject,
  WorkspaceProject,
} from "./types";

export function getUntitledStarterContent() {
  return defaultNewDocumentTemplate;
}

export const untitledStarterContent = getUntitledStarterContent();

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

export function createUntitledDocument(): DocumentTab {
  return {
    id: "document-1",
    content: getUntitledStarterContent(),
    filePath: null,
    isDirty: false,
  };
}

export function createDocumentTab(
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

export function createProject(
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

export function createImportedProject(
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
