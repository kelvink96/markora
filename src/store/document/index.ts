import { create } from "zustand";
import { getUntitledStarterContent, untitledStarterContent } from "./factories";
import { createDocumentTabSlice } from "./tabs-slice";
import { createWorkspaceProjectSlice, initialProject } from "./projects-slice";
import type { DocumentStore } from "./types";

export { getUntitledStarterContent, untitledStarterContent };
export { selectHasUnsavedChanges } from "./selectors";
export type {
  DocumentStore,
  DocumentTab,
  ImportedWorkspaceProject,
  RecentDocumentEntry,
  WorkspaceProject,
  WorkspaceSnapshot,
} from "./types";

/**
 * Workspace documents: projects, their tabs, the active tab and recents.
 * Built from two slices: tab actions (tabs-slice) and project actions (projects-slice).
 * `view.ts` keeps the flat active-document fields in sync with the project tree.
 */
export const useDocumentStore = create<DocumentStore>()((...args) => ({
  content: "",
  filePath: null,
  isDirty: false,
  openDocuments: [],
  activeDocumentId: "",
  projects: [initialProject],
  activeProjectId: initialProject.id,
  recentDocuments: [],
  ...createDocumentTabSlice(...args),
  ...createWorkspaceProjectSlice(...args),
}));
