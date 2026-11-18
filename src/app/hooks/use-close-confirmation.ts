import { useCallback, useState } from "react";
import { useDocumentStore } from "../../store/document";
import { useSettingsStore } from "../../features/settings/settings-store";

export type PendingCloseRequest = { type: "single"; documentId: string } | { type: "all" } | null;

/**
 * Closing tabs with unsaved edits asks first (when the setting is on). Components
 * call `requestClose*`; the discard dialog reads `pendingCloseRequest` and calls
 * `confirmPendingClose` or `cancelPendingClose`.
 */
export function useCloseConfirmation() {
  const [pendingCloseRequest, setPendingCloseRequest] = useState<PendingCloseRequest>(null);
  const closeDocument = useDocumentStore((state) => state.closeDocument);
  const closeAllDocuments = useDocumentStore((state) => state.closeAllDocuments);

  const requestCloseTab = useCallback(
    (documentId: string) => {
      const { activeDocumentId, isDirty, openDocuments } = useDocumentStore.getState();
      const confirmOnUnsavedClose = useSettingsStore.getState().settings.files.confirmOnUnsavedClose;
      const targetDocument = openDocuments.find((document) => document.id === documentId);
      if (!targetDocument) return;

      const shouldConfirm = documentId === activeDocumentId ? isDirty : targetDocument.isDirty;
      if (shouldConfirm && confirmOnUnsavedClose) {
        setPendingCloseRequest({ type: "single", documentId });
        return;
      }

      closeDocument(documentId);
    },
    [closeDocument],
  );

  const requestCloseAllTabs = useCallback(() => {
    const { openDocuments } = useDocumentStore.getState();
    if (openDocuments.length === 0) {
      return;
    }

    const confirmOnUnsavedClose = useSettingsStore.getState().settings.files.confirmOnUnsavedClose;
    const hasDirtyDocuments = openDocuments.some((document) => document.isDirty);

    if (hasDirtyDocuments && confirmOnUnsavedClose) {
      setPendingCloseRequest({ type: "all" });
      return;
    }

    closeAllDocuments();
  }, [closeAllDocuments]);

  const requestCloseCurrentTab = useCallback(() => {
    requestCloseTab(useDocumentStore.getState().activeDocumentId);
  }, [requestCloseTab]);

  const cancelPendingClose = useCallback(() => {
    setPendingCloseRequest(null);
  }, []);

  const confirmPendingClose = useCallback(() => {
    if (!pendingCloseRequest) {
      return;
    }

    if (pendingCloseRequest.type === "all") {
      closeAllDocuments();
    } else {
      closeDocument(pendingCloseRequest.documentId);
    }

    setPendingCloseRequest(null);
  }, [closeAllDocuments, closeDocument, pendingCloseRequest]);

  return {
    pendingCloseRequest,
    requestCloseTab,
    requestCloseAllTabs,
    requestCloseCurrentTab,
    cancelPendingClose,
    confirmPendingClose,
  };
}
