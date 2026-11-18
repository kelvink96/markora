import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useExport } from "./use-export";
import { useDocumentStore } from "../../store/document";
import type { FileAdapter } from "../../platform/files/types";

const { toastSuccess, toastError, printDocumentMock, renderMock } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  printDocumentMock: vi.fn(),
  renderMock: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));
vi.mock("../../features/export/print-document", () => ({ printDocument: printDocumentMock }));
vi.mock("../../platform/markdown", () => ({ getMarkdownAdapter: () => ({ render: renderMock }) }));

function adapter(overrides: Partial<FileAdapter> = {}): FileAdapter {
  return {
    pickOpenPath: vi.fn(),
    pickSavePath: vi.fn().mockResolvedValue("/out/Notes.html"),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    supportsDirectoryAccess: () => false,
    supportsFileImport: () => false,
    supportsFileExport: () => false,
    ...overrides,
  };
}

function openDocument(filePath: string | null, content: string) {
  const document = { id: "doc-1", content, filePath, isDirty: false };
  useDocumentStore.setState({
    projects: [{ id: "project-1", name: "P", documents: [document], activeDocumentId: "doc-1" }],
    activeProjectId: "project-1",
    openDocuments: [document],
    activeDocumentId: "doc-1",
    content,
    filePath,
    isDirty: false,
    recentDocuments: [],
  });
}

describe("useExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderMock.mockResolvedValue("<h1>Notes</h1>");
    openDocument("/docs/Notes.md", "# Notes");
  });

  describe("HTML", () => {
    it("asks where to save on desktop, offering an HTML file, and writes a standalone document", async () => {
      const files = adapter();
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(files.pickSavePath).toHaveBeenCalledWith("Notes.html", { filterName: "HTML", extensions: ["html"] });
      const [path, html] = vi.mocked(files.writeFile).mock.calls[0];
      expect(path).toBe("/out/Notes.html");
      expect(html).toContain("<!doctype html>");
      expect(html).toContain("<h1>Notes</h1>");
      expect(html).toContain("<title>Notes</title>");
      expect(toastSuccess).toHaveBeenCalledWith("Exported to /out/Notes.html");
    });

    it("writes nothing when the save dialog is cancelled", async () => {
      const files = adapter({ pickSavePath: vi.fn().mockResolvedValue(null) });
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(files.writeFile).not.toHaveBeenCalled();
      expect(toastSuccess).not.toHaveBeenCalled();
      expect(toastError).not.toHaveBeenCalled();
    });

    it("downloads the file on web, as text/html", async () => {
      const exportFile = vi.fn().mockResolvedValue(undefined);
      const files = adapter({ supportsFileExport: () => true, exportFile });
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(exportFile).toHaveBeenCalledWith("Notes.html", expect.stringContaining("<!doctype html>"), "text/html");
      expect(files.pickSavePath).not.toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith("Exported Notes.html");
    });

    it("uses the first heading as the page title, but keeps a plain file name", async () => {
      openDocument("/docs/q3-notes.md", "intro\n\n## Quarterly Notes ##\n");
      const files = adapter();
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(files.pickSavePath).toHaveBeenCalledWith("q3-notes.html", expect.anything());
      expect(vi.mocked(files.writeFile).mock.calls[0][1]).toContain("<title>Quarterly Notes</title>");
    });

    it("names an unsaved document after its first heading", async () => {
      openDocument(null, "# My Plan\n\ntext");
      const files = adapter();
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(files.pickSavePath).toHaveBeenCalledWith("my-plan.html", expect.anything());
    });

    it("reports a failure instead of throwing", async () => {
      const files = adapter({ writeFile: vi.fn().mockRejectedValue(new Error("disk full")) });
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(toastError).toHaveBeenCalledWith("Export failed. Please try again.");
    });

    it("does nothing when no document is open", async () => {
      useDocumentStore.setState({ openDocuments: [], activeDocumentId: "", content: "", filePath: null });
      const files = adapter();
      const { result } = renderHook(() => useExport(files));

      await act(() => result.current.exportHtml());

      expect(files.pickSavePath).not.toHaveBeenCalled();
      expect(renderMock).not.toHaveBeenCalled();
    });
  });

  describe("PDF", () => {
    it("opens the print dialog with the rendered document and its title", async () => {
      const { result } = renderHook(() => useExport(adapter()));

      await act(() => result.current.exportPdf());

      expect(printDocumentMock).toHaveBeenCalledWith({ title: "Notes", bodyHtml: "<h1>Notes</h1>" });
    });

    it("reports a failure instead of throwing", async () => {
      renderMock.mockRejectedValue(new Error("render failed"));
      const { result } = renderHook(() => useExport(adapter()));

      await act(() => result.current.exportPdf());

      expect(toastError).toHaveBeenCalledWith("Could not open the print dialog. Please try again.");
      expect(printDocumentMock).not.toHaveBeenCalled();
    });

    it("does nothing when no document is open", async () => {
      useDocumentStore.setState({ openDocuments: [], activeDocumentId: "", content: "", filePath: null });
      const { result } = renderHook(() => useExport(adapter()));

      await act(() => result.current.exportPdf());

      expect(printDocumentMock).not.toHaveBeenCalled();
    });
  });
});
