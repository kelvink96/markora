import type { FileAdapter } from "./types";
import type { WorkspaceDirectorySnapshot, WorkspaceFileSnapshot } from "./types";

function unsupported(): never {
  throw new Error("Web file adapter is not implemented yet.");
}

function supportsDirectoryAccess() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

function supportsFileImport() {
  return typeof document !== "undefined";
}

function supportsFileExport() {
  return typeof document !== "undefined" && typeof URL !== "undefined";
}

function isMarkdownFile(name: string) {
  return /\.(md|markdown|txt)$/i.test(name);
}

function createFileInput() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
  return input;
}

async function readSelectedFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  const imported = await Promise.all(
    files
      .filter((file) => isMarkdownFile(file.name))
      .map(async (file) => ({
        name: file.name,
        path: file.name,
        content: await file.text(),
      })),
  );

  return imported;
}

async function readFileHandle(
  handle: FileSystemFileHandle,
  path: string,
): Promise<WorkspaceFileSnapshot | null> {
  if (!isMarkdownFile(handle.name)) {
    return null;
  }

  const file = await handle.getFile();

  return {
    name: handle.name,
    path,
    content: await file.text(),
    handle,
  };
}

async function readDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  currentPath = "",
): Promise<WorkspaceFileSnapshot[]> {
  const files: WorkspaceFileSnapshot[] = [];

  for await (const entry of handle.values()) {
    const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.kind === "file") {
      const file = await readFileHandle(entry as FileSystemFileHandle, nextPath);
      if (file) {
        files.push(file);
      }
      continue;
    }

    files.push(...(await readDirectoryHandle(entry as FileSystemDirectoryHandle, nextPath)));
  }

  return files;
}

export const webFileAdapter: FileAdapter = {
  async pickOpenPath() {
    return unsupported();
  },
  async pickSavePath() {
    return unsupported();
  },
  async readFile() {
    return unsupported();
  },
  async writeFile() {
    return unsupported();
  },
  async writeWorkspaceFile(handle, content) {
    const writable = await handle.createWritable?.();
    if (!writable) {
      throw new Error("Browser file handle is not writable.");
    }

    await writable.write(content);
    await writable.close();
  },
  supportsDirectoryAccess,
  supportsFileImport,
  supportsFileExport,
  async openDirectory(): Promise<WorkspaceDirectorySnapshot | null> {
    if (!supportsDirectoryAccess()) {
      return null;
    }

    const handle = await window.showDirectoryPicker!();
    const files = await readDirectoryHandle(handle);

    return {
      name: handle.name,
      handle,
      files,
    };
  },
  async importFiles(): Promise<WorkspaceFileSnapshot[] | null> {
    if (!supportsFileImport()) {
      return null;
    }

    const input = createFileInput();

    return new Promise((resolve) => {
      input.addEventListener(
        "change",
        () => {
          const { files } = input;

          if (!files || files.length === 0) {
            resolve(null);
            return;
          }

          void readSelectedFiles(files).then(resolve);
        },
        { once: true },
      );

      input.click();
    });
  },
  async exportFile(fileName, content) {
    if (!supportsFileExport()) {
      throw new Error("Browser file export is not supported.");
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
