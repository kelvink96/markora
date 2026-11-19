import type { FileAdapter } from "./types";

// Dialogs open from Rust so it can record the picked paths; read_file/write_file
// refuse any path that wasn't picked this session.
export const desktopFileAdapter: FileAdapter = {
  async pickOpenPath() {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string | null>("pick_open_path");
  },
  async pickSavePath(defaultPath, options) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string | null>("pick_save_path", {
      defaultPath,
      extensions: options?.extensions,
      filterName: options?.filterName,
    });
  },
  async readFile(path) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("read_file", { path });
  },
  async writeFile(path, content) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, content });
  },
  async takeLaunchPaths() {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string[]>("take_pending_open_paths");
  },
  async onOpenFiles(handler) {
    const { listen } = await import("@tauri-apps/api/event");
    return listen<string[]>("open-files", (event) => handler(event.payload));
  },
  supportsDirectoryAccess() {
    return false;
  },
  supportsFileImport() {
    return false;
  },
  supportsFileExport() {
    return false;
  },
};
