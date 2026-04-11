interface Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file";
  getFile(): Promise<File>;
  createWritable?(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: "directory";
  values(): AsyncIterable<FileSystemHandle>;
}
