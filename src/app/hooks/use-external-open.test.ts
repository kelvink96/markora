import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useExternalOpen } from "./use-external-open";
import { useDocumentStore } from "../../store/document";
import type { FileAdapter } from "../../platform/files/types";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type OpenHandler = (paths: string[]) => void;

function adapter(files: Record<string, string>, launchPaths: string[] = []) {
  let handler: OpenHandler = () => {};
  const unsubscribe = vi.fn();
  const fileAdapter: FileAdapter = {
    pickOpenPath: vi.fn(),
    pickSavePath: vi.fn(),
    readFile: vi.fn(async (path: string) => {
      if (!(path in files)) throw new Error("not found");
      return files[path];
    }),
    writeFile: vi.fn(),
    supportsDirectoryAccess: () => false,
    supportsFileImport: () => false,
    supportsFileExport: () => false,
    takeLaunchPaths: vi.fn(async () => launchPaths),
    onOpenFiles: vi.fn(async (next: OpenHandler) => {
      handler = next;
      return unsubscribe;
    }),
  };
  return { fileAdapter, unsubscribe, emit: (paths: string[]) => handler(paths) };
}

function openPaths() {
  return useDocumentStore.getState().openDocuments.map((document) => document.filePath);
}

describe("useExternalOpen", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    useDocumentStore.setState({
      projects: [{ id: "project-1", name: "P", documents: [], activeDocumentId: "" }],
      activeProjectId: "project-1",
      openDocuments: [],
      activeDocumentId: "",
      content: "",
      filePath: null,
      isDirty: false,
      recentDocuments: [],
    });
  });

  it("opens the files the app was launched with and shows the last one", async () => {
    const { fileAdapter } = adapter({ "/a.md": "# A", "/b.md": "# B" }, ["/a.md", "/b.md"]);

    renderHook(() => useExternalOpen(fileAdapter, true));

    await waitFor(() => expect(openPaths()).toEqual(["/a.md", "/b.md"]));
    expect(useDocumentStore.getState().filePath).toBe("/b.md");
    expect(useDocumentStore.getState().content).toBe("# B");
  });

  it("opens files handed over by a second launch as new tabs", async () => {
    const { fileAdapter, emit } = adapter({ "/a.md": "# A", "/c.md": "# C" }, ["/a.md"]);
    renderHook(() => useExternalOpen(fileAdapter, true));
    await waitFor(() => expect(openPaths()).toEqual(["/a.md"]));

    emit(["/c.md"]);

    await waitFor(() => expect(openPaths()).toEqual(["/a.md", "/c.md"]));
    expect(useDocumentStore.getState().filePath).toBe("/c.md");
  });

  it("waits until the previous session has been restored", async () => {
    const { fileAdapter } = adapter({ "/a.md": "# A" }, ["/a.md"]);

    const { rerender } = renderHook(({ ready }) => useExternalOpen(fileAdapter, ready), {
      initialProps: { ready: false },
    });
    await Promise.resolve();
    expect(fileAdapter.takeLaunchPaths).not.toHaveBeenCalled();
    expect(openPaths()).toEqual([]);

    rerender({ ready: true });

    await waitFor(() => expect(openPaths()).toEqual(["/a.md"]));
  });

  it("skips a file that cannot be read and still opens the others", async () => {
    const { fileAdapter } = adapter({ "/b.md": "# B" }, ["/missing.md", "/b.md"]);

    renderHook(() => useExternalOpen(fileAdapter, true));

    await waitFor(() => expect(openPaths()).toEqual(["/b.md"]));
    expect(toast.error).toHaveBeenCalledWith("Could not open missing.md");
  });

  it("stops listening when unmounted", async () => {
    const { fileAdapter, unsubscribe } = adapter({});
    const { unmount } = renderHook(() => useExternalOpen(fileAdapter, true));
    await waitFor(() => expect(fileAdapter.onOpenFiles).toHaveBeenCalled());

    unmount();

    await waitFor(() => expect(unsubscribe).toHaveBeenCalled());
  });

  it("does nothing on platforms without launch files", () => {
    const { fileAdapter } = adapter({});
    delete fileAdapter.takeLaunchPaths;
    delete fileAdapter.onOpenFiles;

    expect(() => renderHook(() => useExternalOpen(fileAdapter, true))).not.toThrow();
  });
});
