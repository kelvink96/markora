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

export interface WorkspaceSnapshot {
  projects: WorkspaceProject[];
  activeProjectId: string;
  recentDocuments: RecentDocumentEntry[];
}

/** Everything the store holds, before any actions. */
export interface DocumentState {
  // Backward-compatible active document fields used across the current app.
  content: string;
  filePath: string | null;
  isDirty: boolean;
  openDocuments: DocumentTab[];
  activeDocumentId: string;
  projects: WorkspaceProject[];
  activeProjectId: string;
  recentDocuments: RecentDocumentEntry[];
}

/** Actions on the tabs of the active project. */
export interface DocumentTabActions {
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  markClean: () => void;
  newDocument: (content?: string) => void;
  addDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  openDocument: (document?: Partial<Omit<DocumentTab, "id">>) => string;
  selectDocument: (id: string) => void;
  closeDocument: (id: string) => void;
  closeAllDocuments: () => void;
}

/** Actions on projects and the persisted workspace. */
export interface WorkspaceProjectActions {
  createProject: (name?: string) => string;
  selectProject: (id: string) => void;
  importProject: (project: ImportedWorkspaceProject) => string;
  hydrateWorkspace: (workspace: WorkspaceSnapshot) => void;
}

export type DocumentStore = DocumentState & DocumentTabActions & WorkspaceProjectActions;
