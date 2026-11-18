import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSessionRestore } from "./use-session-restore";
import { useDocumentStore } from "../../store/document";
import { createDefaultSettings } from "../../features/settings/settings-schema";
import { useSettingsStore } from "../../features/settings/settings-store";
import { loadSession, saveSession } from "../../features/session/session-storage";
import type { FileAdapter } from "../../platform/files/types";

function adapter(files: Record<string, string>): FileAdapter {
  return {
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
  };
}

function setSettings({ restore, hydrated = true }: { restore: boolean; hydrated?: boolean }) {
  const settings = createDefaultSettings();
  settings.files.restorePreviousSession = restore;
  useSettingsStore.setState({ isHydrated: hydrated, settings });
}

function openPaths() {
  return useDocumentStore.getState().openDocuments.map((document) => document.filePath);
}

describe("useSessionRestore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
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

  it("reopens last time's files and re-selects the active one", async () => {
    saveSession({ openPaths: ["/a.md", "/b.md", "/c.md"], activePath: "/b.md" });
    setSettings({ restore: true });
    const files = adapter({ "/a.md": "# A", "/b.md": "# B", "/c.md": "# C" });

    renderHook(() => useSessionRestore(files, true));

    await waitFor(() => expect(openPaths()).toEqual(["/a.md", "/b.md", "/c.md"]));
    await waitFor(() => expect(useDocumentStore.getState().filePath).toBe("/b.md"));
    expect(useDocumentStore.getState().content).toBe("# B");
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("skips files that can no longer be read and still opens the rest", async () => {
    saveSession({ openPaths: ["/gone.md", "/b.md"], activePath: "/gone.md" });
    setSettings({ restore: true });

    renderHook(() => useSessionRestore(adapter({ "/b.md": "# B" }), true));

    await waitFor(() => expect(openPaths()).toEqual(["/b.md"]));
    expect(console.warn).toHaveBeenCalled();
  });

  it("opens nothing when restore is off, and doesn't touch the saved session", async () => {
    saveSession({ openPaths: ["/a.md"], activePath: "/a.md" });
    setSettings({ restore: false });
    const files = adapter({ "/a.md": "# A" });

    renderHook(() => useSessionRestore(files, true));
    await act(async () => {});

    expect(openPaths()).toEqual([]);
    expect(files.readFile).not.toHaveBeenCalled();
    expect(loadSession().openPaths).toEqual(["/a.md"]);
  });

  it("waits for the settings to load before deciding", async () => {
    saveSession({ openPaths: ["/a.md"], activePath: "/a.md" });
    setSettings({ restore: true, hydrated: false });
    const files = adapter({ "/a.md": "# A" });

    renderHook(() => useSessionRestore(files, true));
    await act(async () => {});
    expect(files.readFile).not.toHaveBeenCalled();

    act(() => useSettingsStore.setState({ isHydrated: true }));

    await waitFor(() => expect(openPaths()).toEqual(["/a.md"]));
  });

  it("does not wipe the saved session while restoring (the app starts with no tabs)", async () => {
    saveSession({ openPaths: ["/a.md"], activePath: "/a.md" });
    setSettings({ restore: true });
    let finishRead: (text: string) => void = () => {};
    const slow = adapter({});
    slow.readFile = vi.fn(() => new Promise<string>((resolve) => (finishRead = resolve)));

    renderHook(() => useSessionRestore(slow, true));
    await act(async () => {});

    expect(loadSession().openPaths).toEqual(["/a.md"]);

    await act(async () => finishRead("# A"));
    await waitFor(() => expect(openPaths()).toEqual(["/a.md"]));
    expect(loadSession().openPaths).toEqual(["/a.md"]);
  });

  it("keeps the saved list in step with the open tabs afterwards", async () => {
    setSettings({ restore: true });
    renderHook(() => useSessionRestore(adapter({}), true));
    await act(async () => {});

    act(() => {
      useDocumentStore.getState().openDocument({ content: "x", filePath: "/new.md", isDirty: false });
    });

    await waitFor(() =>
      expect(loadSession()).toEqual({ openPaths: ["/new.md"], activePath: "/new.md" }),
    );

    act(() => useDocumentStore.getState().closeAllDocuments());

    await waitFor(() => expect(loadSession()).toEqual({ openPaths: [], activePath: null }));
  });

  it("ignores unsaved documents, which have no file to reopen", async () => {
    setSettings({ restore: true });
    renderHook(() => useSessionRestore(adapter({}), true));
    await act(async () => {});

    act(() => {
      useDocumentStore.getState().openDocument({ content: "scratch", filePath: null });
      useDocumentStore.getState().openDocument({ content: "x", filePath: "/saved.md", isDirty: false });
    });

    await waitFor(() => expect(loadSession().openPaths).toEqual(["/saved.md"]));
  });

  it("does not save the session when restore is off", async () => {
    setSettings({ restore: false });
    renderHook(() => useSessionRestore(adapter({}), true));
    await act(async () => {});

    act(() => {
      useDocumentStore.getState().openDocument({ content: "x", filePath: "/a.md", isDirty: false });
    });
    await act(async () => {});

    expect(loadSession().openPaths).toEqual([]);
  });

  it("does nothing on web", async () => {
    saveSession({ openPaths: ["/a.md"], activePath: "/a.md" });
    setSettings({ restore: true });
    const files = adapter({ "/a.md": "# A" });

    renderHook(() => useSessionRestore(files, false));
    act(() => {
      useDocumentStore.getState().openDocument({ content: "x", filePath: "/other.md", isDirty: false });
    });
    await act(async () => {});

    expect(files.readFile).not.toHaveBeenCalled();
    expect(loadSession().openPaths).toEqual(["/a.md"]);
  });
});
