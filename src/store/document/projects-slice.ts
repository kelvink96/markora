import type { StateCreator } from "zustand";
import { createImportedProject, createProject } from "./factories";
import { recordRecent } from "./recents";
import type { DocumentStore, WorkspaceProject, WorkspaceProjectActions } from "./types";
import { normalizeState, syncActiveProjectView } from "./view";

export const initialProject: WorkspaceProject = {
  id: "project-1",
  name: "Project 1",
  documents: [],
  activeDocumentId: "",
};

export const createWorkspaceProjectSlice: StateCreator<
  DocumentStore,
  [],
  [],
  WorkspaceProjectActions
> = (set, get) => ({
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
      let recentDocuments = current.recentDocuments;
      for (const document of nextProject.documents) {
        recentDocuments = recordRecent(recentDocuments, nextProject.id, document);
      }

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
});
