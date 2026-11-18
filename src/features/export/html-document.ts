import DOMPurify from "dompurify";
import type { MarkdownAdapter } from "../../platform/markdown/types";
import { highlightCodeBlocks } from "../preview/highlight-code";
import { exportCss } from "./export-styles";

/**
 * Renders markdown to safe HTML for an export. Relative image links are left as written (an
 * exported file has no app to resolve them), and the result goes through the same sanitizer as the
 * preview, so an exported file can't carry scripts from a hostile document.
 */
export async function renderExportBody(markdown: string, adapter: MarkdownAdapter): Promise<string> {
  const rendered = await adapter.render(markdown, { documentPath: null });
  return DOMPurify.sanitize(highlightCodeBlocks(rendered));
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** A complete, standalone HTML file: no external requests, styles inlined. */
export function buildHtmlDocument({ title, bodyHtml }: { title: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Markora">
<title>${escapeHtml(title)}</title>
<style>${exportCss("body")}</style>
</head>
<body>
<main class="markora-document">
${bodyHtml}
</main>
</body>
</html>
`;
}
