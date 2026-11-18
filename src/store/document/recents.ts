import type { DocumentTab, RecentDocumentEntry } from "./types";

function deriveDocumentTitle(document: Pick<DocumentTab, "filePath" | "content">) {
  if (document.filePath) {
    const parts = document.filePath.split(/[\\/]/);
    return parts[parts.length - 1] || "Untitled";
  }

  const firstMeaningfulLine = document.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstMeaningfulLine?.replace(/^#+\s*/, "") || "Untitled";
}

/** Moves a document to the front of the recents list, replacing any older entry for it. */
export function recordRecent(
  recentDocuments: RecentDocumentEntry[],
  projectId: string,
  document: DocumentTab,
) {
  const nextEntry: RecentDocumentEntry = {
    projectId,
    documentId: document.id,
    filePath: document.filePath,
    title: deriveDocumentTitle(document),
    lastOpenedAt: Date.now(),
  };

  return [
    nextEntry,
    ...recentDocuments.filter(
      (entry) => !(entry.projectId === projectId && entry.documentId === document.id),
    ),
  ];
}
