export function getDisplayFileName(filePath: string | null): string {
  if (!filePath) return "Untitled";

  // Normalize Windows paths so the basename logic works on every platform.
  return filePath.replace(/\\/g, "/").split("/").pop() ?? "Untitled";
}

export function getWordCount(content: string): number {
  const normalized = content.trim();
  if (!normalized) return 0;

  const words = normalized.match(/[A-Za-z0-9À-ÿ]+(?:'[A-Za-z0-9À-ÿ]+)?/g);
  return words?.length ?? 0;
}
