import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useFileOperations } from "./use-file-operations";
import { useDocumentStore } from "../../store/document";
import type { FileAdapter } from "../../platform/files/types";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { useSettingsStore } from "../../features/settings/settings-store";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createAdapter(overrides: Partial<FileAdapter> = {}): FileAdapter {
  return {
    pickOpenPath: vi.fn().mockResolvedValue(null),
    pickSavePath: vi.fn().mockResolvedValue(null),
    readFile: vi.fn().mockResolvedValue(""),
    writeFile: vi.fn().mockResolvedValue(undefined),
    supportsDirectoryAccess: () => false,
    supportsFileImport: () => false,
    supportsFileExport: () => false,
    ...overrides,
  };
}

function seedDocument(filePath: string | null, content: string, handle?: FileSystemFileHandle) {
  const document = { id: "doc-1", content, filePath, isDirty: true, handle };
  useDocumentStore.setState({
    projects: [{ id: "project-1", name: "P", documents: [document], activeDocumentId: "doc-1" }],
    activeProjectId: "project-1",
    openDocuments: [document],
    activeDocumentId: "doc-1",
    content,
    filePath,
    isDirty: true,
    recentDocuments: [],
  });
}

describe("useFileOperations", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useSettingsStore.getState().hydrate(createDefaultSettings());
  });

  function setDefaultSaveFolder(defaultSaveFolder: string) {
    const settings = createDefaultSettings();
    useSettingsStore.getState().hydrate({ ...settings, files: { ...settings.files, defaultSaveFolder } });
  }

  describe("save feedback", () => {
    beforeEach(() => {
      vi.mocked(toast.success).mockClear();
    });

    it("announces a manual save to an existing path", async () => {
      const adapter = createAdapter();
      seedDocument("/notes/a.md", "# A");
      const { result } = renderHook(() => useFileOperations(adapter));

      await act(() => result.current.handleSave());

      expect(toast.success).toHaveBeenCalledWith("Saved a.md");
    });

    it("announces a browser download as a download, not a save", async () => {
      const adapter = createAdapter({ supportsFileExport: () => true, exportFile: vi.fn().mockResolvedValue(undefined) });
      seedDocument(null, "# My Plan\n\ntext");
      const { result } = renderHook(() => useFileOperations(adapter));

      await act(() => result.current.handleSave());

      expect(toast.success).toHaveBeenCalledWith("Downloaded my-plan.md");
    });

    it("does not announce when the user cancels the save dialog", async () => {
      const adapter = createAdapter();
      seedDocument(null, "# New");
      const { result } = renderHook(() => useFileOperations(adapter));

      await act(() => result.current.handleSave());

      expect(toast.success).not.toHaveBeenCalled();
    });

    it("stays silent for autosave", async () => {
      const adapter = createAdapter();
      seedDocument("/notes/a.md", "# A");
      const { result } = renderHook(() => useFileOperations(adapter));

      await act(() => result.current.handleAutosave());

      expect(adapter.writeFile).toHaveBeenCalledWith("/notes/a.md", "# A");
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it("saves to the existing path and marks the document clean", async () => {
    const adapter = createAdapter();
    seedDocument("/notes/a.md", "# A");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSave());

    expect(adapter.writeFile).toHaveBeenCalledWith("/notes/a.md", "# A");
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("asks where to save an untitled document, then records the path", async () => {
    const adapter = createAdapter({ pickSavePath: vi.fn().mockResolvedValue("/notes/new.md") });
    seedDocument(null, "# New");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSave());

    expect(adapter.pickSavePath).toHaveBeenCalledWith("untitled.md", { folder: undefined });
    expect(adapter.writeFile).toHaveBeenCalledWith("/notes/new.md", "# New");
    expect(useDocumentStore.getState().filePath).toBe("/notes/new.md");
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("starts the save dialog of an untitled document in the default save folder", async () => {
    setDefaultSaveFolder("/notes");
    const adapter = createAdapter();
    seedDocument(null, "# New");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSaveAs());

    expect(adapter.pickSavePath).toHaveBeenCalledWith("untitled.md", { folder: "/notes" });
  });

  it("does not steer Save As for a document that already has a file", async () => {
    setDefaultSaveFolder("/notes");
    const adapter = createAdapter();
    seedDocument("/elsewhere/a.md", "# A");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSaveAs());

    expect(adapter.pickSavePath).toHaveBeenCalledWith("untitled.md", { folder: undefined });
  });

  it("leaves the document dirty when the save dialog is cancelled", async () => {
    const adapter = createAdapter();
    seedDocument(null, "# New");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSaveAs());

    expect(adapter.writeFile).not.toHaveBeenCalled();
    expect(useDocumentStore.getState().isDirty).toBe(true);
  });

  it("writes folder-backed documents through their file handle", async () => {
    const handle = { kind: "file" } as unknown as FileSystemFileHandle;
    const adapter = createAdapter({ writeWorkspaceFile: vi.fn().mockResolvedValue(undefined) });
    seedDocument("notes.md", "# H", handle);
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSave());

    expect(adapter.writeWorkspaceFile).toHaveBeenCalledWith(handle, "# H");
    expect(adapter.writeFile).not.toHaveBeenCalled();
  });

  it("downloads with a name taken from the first heading when saving on the web", async () => {
    const adapter = createAdapter({
      supportsFileExport: () => true,
      exportFile: vi.fn().mockResolvedValue(undefined),
    });
    seedDocument(null, "# My Plan\n\ntext");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSave());

    expect(adapter.exportFile).toHaveBeenCalledWith("my-plan.md", "# My Plan\n\ntext");
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("shows a dismissible error when saving fails", async () => {
    const adapter = createAdapter({ writeFile: vi.fn().mockRejectedValue(new Error("disk full")) });
    seedDocument("/notes/a.md", "# A");
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleSave());
    expect(result.current.fileError).toBe("Failed to save file. Please try again.");
    expect(useDocumentStore.getState().isDirty).toBe(true);

    act(() => result.current.clearFileError());
    expect(result.current.fileError).toBeNull();
  });

  it("shows an error when opening a file fails", async () => {
    const adapter = createAdapter({
      pickOpenPath: vi.fn().mockResolvedValue("/notes/a.md"),
      readFile: vi.fn().mockRejectedValue(new Error("denied")),
    });
    const { result } = renderHook(() => useFileOperations(adapter));

    await act(() => result.current.handleOpen());

    expect(result.current.fileError).toBe("Failed to open file. Please try again.");
  });

  describe("canSaveInPlace", () => {
    it("is true for a document with a file path on desktop", () => {
      seedDocument("/notes/a.md", "# A");
      const { result } = renderHook(() => useFileOperations(createAdapter()));

      expect(result.current.canSaveInPlace()).toBe(true);
    });

    it("is false for an untitled document, which would open a save dialog", () => {
      seedDocument(null, "# A");
      const { result } = renderHook(() => useFileOperations(createAdapter()));

      expect(result.current.canSaveInPlace()).toBe(false);
    });

    it("is true for a folder-backed web document with a file handle", () => {
      const handle = { kind: "file" } as unknown as FileSystemFileHandle;
      seedDocument("notes.md", "# A", handle);
      const adapter = createAdapter({
        writeWorkspaceFile: vi.fn(),
        supportsFileExport: () => true,
        exportFile: vi.fn(),
      });
      const { result } = renderHook(() => useFileOperations(adapter));

      expect(result.current.canSaveInPlace()).toBe(true);
    });

    it("is false for web documents that would only download, even with a path", () => {
      seedDocument("imported.md", "# A");
      const adapter = createAdapter({ supportsFileExport: () => true, exportFile: vi.fn() });
      const { result } = renderHook(() => useFileOperations(adapter));

      expect(result.current.canSaveInPlace()).toBe(false);
    });

    it("is false when no document is open", () => {
      useDocumentStore.setState({ openDocuments: [], activeDocumentId: "", filePath: null });
      const { result } = renderHook(() => useFileOperations(createAdapter()));

      expect(result.current.canSaveInPlace()).toBe(false);
    });
  });
});
