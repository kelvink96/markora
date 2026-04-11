import type { MarkdownAdapter } from "./types";
import { marked } from "marked";

marked.setOptions({
  async: false,
  gfm: true,
  breaks: false,
});

export const webMarkdownAdapter: MarkdownAdapter = {
  async render(markdown) {
    return marked.parse(markdown);
  },
};
