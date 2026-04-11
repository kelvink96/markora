import type { MarkdownAdapter } from "./types";

export const desktopMarkdownAdapter: MarkdownAdapter = {
  async render(markdown) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("parse_markdown", { markdown });
  },
};
