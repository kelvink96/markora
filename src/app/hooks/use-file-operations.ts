import { useCallback, useState } from "react";
import { getDocumentExportName } from "../../features/document/document-names";
import type { FileAdapter } from "../../platform/files/types";
import { useDocumentStore } from "../../store/document";

/**
 * Open, save, save-as and import for the active document, routed through the
 * platform file adapter. Failures surface as a dismissible `fileError`.
 */
export function useFileOperations(fileAdapter: FileAdapter) {
  const [fileError, setFileError] = useState<string | null>(null);
  const openDocument = useDocumentStore((state) => state.openDocument);
  const importProject = useDocumentStore((state) => state.importProject);
  const setFilePath = useDocumentStore((state) => state.setFilePath);
  const markClean = useDocumentStore((state) => state.markClean);

  const clearFileError = useCallback(() => setFileError(null), []);

  const handleImportFiles = useCallback(async () => {
    if (!fileAdapter.importFiles) {
      return;
    }

    try {
      const files = await fileAdapter.importFiles();
      if (!files || files.length === 0) {
        return;
      }

      importProject({
        name: files.length === 1 ? files[0].name : "Imported files",
        documents: files.map((file) => ({
          content: file.content,
          filePath: file.path,
          isDirty: false,
          handle: file.handle,
        })),
      });
    } catch (error) {
      setFileError("Failed to import files. Please try again.");
      console.error("import files failed:", error);
    }
  }, [fileAdapter, importProject]);

  const exportCurrentDocument = useCallback(async () => {
    if (!fileAdapter.exportFile) {
      return false;
    }

    const { activeDocumentId, content, filePath, openDocuments } = useDocumentStore.getState();
    if (!activeDocumentId) {
      return false;
    }

    const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);
    const exportName = getDocumentExportName(activeDocument?.filePath ?? filePath, content);

    await fileAdapter.exportFile(exportName, content);
    markClean();
    return true;
  }, [fileAdapter, markClean]);

  const handleOpen = useCallback(async () => {
    if (fileAdapter.supportsFileImport() && fileAdapter.importFiles) {
      await handleImportFiles();
      return;
    }

    try {
      const selected = await fileAdapter.pickOpenPath();
      if (selected) {
        const text = await fileAdapter.readFile(selected);
        openDocument({ content: text, filePath: selected, isDirty: false });
      }
    } catch (error) {
      setFileError("Failed to open file. Please try again.");
      console.error("open file failed:", error);
    }
  }, [fileAdapter, handleImportFiles, openDocument]);

  const handleSaveAs = useCallback(async () => {
    const { activeDocumentId, content } = useDocumentStore.getState();
    if (!activeDocumentId) return;

    try {
      if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) {
        await exportCurrentDocument();
        return;
      }

      const savePath = await fileAdapter.pickSavePath("untitled.md");
      if (savePath) {
        await fileAdapter.writeFile(savePath, content);
        setFilePath(savePath);
        markClean();
      }
    } catch (error) {
      setFileError("Failed to save file. Please try again.");
      console.error("save file failed:", error);
    }
  }, [exportCurrentDocument, fileAdapter, markClean, setFilePath]);

  const handleSave = useCallback(async () => {
    const { activeDocumentId, filePath, content, openDocuments } = useDocumentStore.getState();
    if (!activeDocumentId) return;

    try {
      const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);

      if (activeDocument?.handle && fileAdapter.writeWorkspaceFile) {
        await fileAdapter.writeWorkspaceFile(activeDocument.handle, content);
        markClean();
        return;
      }

      if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) {
        await exportCurrentDocument();
        return;
      }

      if (filePath) {
        await fileAdapter.writeFile(filePath, content);
        markClean();
      } else {
        await handleSaveAs();
      }
    } catch (error) {
      setFileError("Failed to save file. Please try again.");
      console.error("save file failed:", error);
    }
  }, [exportCurrentDocument, fileAdapter, handleSaveAs, markClean]);

  /**
   * True when `handleSave` would write the active document straight to its file, with no
   * dialog or download. Autosave only runs in that case. Mirrors handleSave's branches.
   */
  const canSaveInPlace = useCallback(() => {
    const { activeDocumentId, filePath, openDocuments } = useDocumentStore.getState();
    const activeDocument = openDocuments.find((document) => document.id === activeDocumentId);
    if (!activeDocument) return false;

    if (activeDocument.handle && fileAdapter.writeWorkspaceFile) return true;
    if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) return false;
    return Boolean(filePath);
  }, [fileAdapter]);

  return { fileError, clearFileError, handleOpen, handleSave, handleSaveAs, canSaveInPlace };
}
