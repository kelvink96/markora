import type { MarkdownAdapter } from "./types";

export const desktopMarkdownAdapter: MarkdownAdapter = {
  async render(markdown, options) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("parse_markdown", {
      markdown,
      documentPath: options?.documentPath ?? null,
    });
  },
};
