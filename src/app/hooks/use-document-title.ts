import { useEffect } from "react";
import { getDocumentTitle } from "../../features/document/document-names";
import { useDocumentStore } from "../../store/document";

/** Keeps the window title in step with the active document: "Name • Markora". */
export function useDocumentTitle() {
  const openDocuments = useDocumentStore((state) => state.openDocuments);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);

  useEffect(() => {
    const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);
    const titleLabel = activeDocument
      ? getDocumentTitle(activeDocument.filePath, activeDocument.content)
      : "Markora";

    document.title = titleLabel === "Markora" ? "Markora" : `${titleLabel} • Markora`;
  }, [activeDocumentId, openDocuments]);
}
