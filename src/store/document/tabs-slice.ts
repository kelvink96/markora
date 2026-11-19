import type { StateCreator } from "zustand";
import { createDocumentTab } from "./factories";
import { recordRecent } from "./recents";
import type { DocumentStore, DocumentTabActions } from "./types";
import { normalizeState, syncActiveProjectView } from "./view";

export const createDocumentTabSlice: StateCreator<DocumentStore, [], [], DocumentTabActions> = (
  set,
  get,
) => ({
  setContent: (content) =>
    set((state) => {
      const normalized = normalizeState(state);
      // Unchanged text is not an edit. The editor reports every document swap, such as a tab
      // switch, back as a change, and that must not mark the file as unsaved.
      const active = normalized.openDocuments.find((document) => document.id === normalized.activeDocumentId);
      if (active?.content === content) {
        return normalized;
      }

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
});
