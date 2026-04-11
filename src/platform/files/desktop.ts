import type { FileAdapter } from "./types";

export const desktopFileAdapter: FileAdapter = {
  async pickOpenPath() {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });

    return typeof selected === "string" ? selected : null;
  },
  async pickSavePath(defaultPath) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const savePath = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath,
    });

    return savePath ?? null;
  },
  async readFile(path) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("read_file", { path });
  },
  async writeFile(path, content) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, content });
  },
};
