/** Suggested file name for a document: its own file name, else a slug of its first line. */
export function getDocumentExportName(filePath: string | null, content: string) {
  if (filePath) {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || "untitled.md";
  }

  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.replace(/^#+\s*/, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .trim();

  if (!firstMeaningfulLine) {
    return "untitled.md";
  }

  const normalized = firstMeaningfulLine.replace(/\s+/g, "-").toLowerCase();
  return `${normalized || "untitled"}.md`;
}

/** Title shown in the window title: the export name without its .md extension. */
export function getDocumentTitle(filePath: string | null, content: string) {
  return getDocumentExportName(filePath, content).replace(/\.md$/i, "");
}
