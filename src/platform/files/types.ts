export interface WorkspaceFileSnapshot {
  name: string;
  path: string;
  content: string;
  handle?: FileSystemFileHandle;
}

export interface WorkspaceDirectorySnapshot {
  name: string;
  handle?: FileSystemDirectoryHandle;
  files: WorkspaceFileSnapshot[];
}

/** Which file type the save dialog offers; the default is Markdown. */
export interface SavePathOptions {
  filterName: string;
  extensions: string[];
}

export interface FileAdapter {
  pickOpenPath(): Promise<string | null>;
  pickSavePath(defaultPath: string, options?: SavePathOptions): Promise<string | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  writeWorkspaceFile?(handle: FileSystemFileHandle, content: string): Promise<void>;
  /** Desktop: files the app was launched with ("Open with", double-click), handed over once. */
  takeLaunchPaths?(): Promise<string[]>;
  /** Desktop: files forwarded by a later launch while the app runs. Resolves to an unsubscribe. */
  onOpenFiles?(handler: (paths: string[]) => void): Promise<() => void>;
  supportsDirectoryAccess(): boolean;
  supportsFileImport(): boolean;
  supportsFileExport(): boolean;
  openDirectory?(): Promise<WorkspaceDirectorySnapshot | null>;
  importFiles?(): Promise<WorkspaceFileSnapshot[] | null>;
  exportFile?(fileName: string, content: string, mimeType?: string): Promise<void>;
}
