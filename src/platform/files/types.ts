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

export interface FileAdapter {
  pickOpenPath(): Promise<string | null>;
  pickSavePath(defaultPath: string): Promise<string | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  writeWorkspaceFile?(handle: FileSystemFileHandle, content: string): Promise<void>;
  supportsDirectoryAccess(): boolean;
  supportsFileImport(): boolean;
  supportsFileExport(): boolean;
  openDirectory?(): Promise<WorkspaceDirectorySnapshot | null>;
  importFiles?(): Promise<WorkspaceFileSnapshot[] | null>;
  exportFile?(fileName: string, content: string): Promise<void>;
}
