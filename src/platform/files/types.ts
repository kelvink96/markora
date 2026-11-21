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

/** What the save dialog offers: a file type (the default is Markdown) and the folder it starts in. */
export interface SavePathOptions {
  filterName?: string;
  extensions?: string[];
  /** Desktop: where the dialog starts. Ignored if the folder no longer exists. */
  folder?: string;
}

export interface FileAdapter {
  pickOpenPath(): Promise<string | null>;
  pickSavePath(defaultPath: string, options?: SavePathOptions): Promise<string | null>;
  /** Desktop: a native folder picker. Resolves to null when cancelled. */
  pickFolder?(): Promise<string | null>;
  /** Desktop: whether a stored folder still exists. */
  folderExists?(path: string): Promise<boolean>;
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
