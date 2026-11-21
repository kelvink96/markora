import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getDocumentTitle, getFirstHeading } from "../../features/document/document-names";
import { buildHtmlDocument, renderExportBody } from "../../features/export/html-document";
import { printDocument } from "../../features/export/print-document";
import type { FileAdapter } from "../../platform/files/types";
import { getMarkdownAdapter } from "../../platform/markdown";
import { useSettingsStore } from "../../features/settings/settings-store";
import { useDocumentStore } from "../../store/document";

/**
 * Export the active document as a standalone HTML file or as a PDF (through the print dialog).
 * Both render the same sanitized body, so what you export matches what the preview shows.
 */
export function useExport(fileAdapter: FileAdapter) {
  const markdownAdapter = useMemo(() => getMarkdownAdapter(), []);

  const prepare = useCallback(async () => {
    const { content, filePath, activeDocumentId } = useDocumentStore.getState();
    if (!activeDocumentId) return null;

    return {
      // What a reader (and the PDF's file name) should see; the HTML file name keeps the plain slug.
      title: getFirstHeading(content) ?? getDocumentTitle(filePath, content),
      fileStem: getDocumentTitle(filePath, content),
      bodyHtml: await renderExportBody(content, markdownAdapter),
    };
  }, [markdownAdapter]);

  const exportHtml = useCallback(async () => {
    try {
      const prepared = await prepare();
      if (!prepared) return;

      const html = buildHtmlDocument(prepared);
      const fileName = `${prepared.fileStem}.html`;

      // The web build downloads the file; the desktop app asks where to save it.
      if (fileAdapter.supportsFileExport() && fileAdapter.exportFile) {
        await fileAdapter.exportFile(fileName, html, "text/html");
        toast.success(`Exported ${fileName}`);
        return;
      }

      const folder = useSettingsStore.getState().settings.files.defaultSaveFolder || undefined;
      const path = await fileAdapter.pickSavePath(fileName, { filterName: "HTML", extensions: ["html"], folder });
      if (!path) return; // the user cancelled the dialog
      await fileAdapter.writeFile(path, html);
      toast.success(`Exported to ${path}`);
    } catch (error) {
      console.error("export html failed:", error);
      toast.error("Export failed. Please try again.");
    }
  }, [fileAdapter, prepare]);

  const exportPdf = useCallback(async () => {
    try {
      const prepared = await prepare();
      if (prepared) printDocument({ title: prepared.title, bodyHtml: prepared.bodyHtml });
    } catch (error) {
      console.error("export pdf failed:", error);
      toast.error("Could not open the print dialog. Please try again.");
    }
  }, [prepare]);

  return { exportHtml, exportPdf };
}
