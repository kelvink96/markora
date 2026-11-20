import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWebWorkspacePersistence } from "./use-web-lifecycle";
import { loadViewState } from "../../features/workspace/view-mode-storage";
import { useWorkspaceState } from "../../features/workspace/workspace-state";
import { useDocumentStore } from "../../store/document";
import type { WorkspaceSnapshot } from "../../platform/persistence/web";
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "../../platform/persistence/web";

vi.mock("../../platform/persistence/web", () => ({
  loadWorkspaceSnapshot: vi.fn(),
  saveWorkspaceSnapshot: vi.fn(async () => {}),
}));

const loadMock = vi.mocked(loadWorkspaceSnapshot);
const saveMock = vi.mocked(saveWorkspaceSnapshot);

function storedSnapshot(): WorkspaceSnapshot {
  return {
    version: 1,
    activeProjectId: "stored-project",
    recentDocuments: [],
    projects: [
      {
        id: "stored-project",
        name: "Stored",
        activeDocumentId: "doc-1",
        documents: [
          {
            id: "doc-1",
            name: "notes.md",
            filePath: null,
            content: "persist-check-123",
            isDirty: true,
          },
        ],
      },
    ] as unknown as WorkspaceSnapshot["projects"],
  };
}

describe("useWebWorkspacePersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("keeps raw syntax for an upgrading web user whose only older data is the IndexedDB workspace", async () => {
    localStorage.clear();
    useWorkspaceState.setState(loadViewState());
    expect(useWorkspaceState.getState()).toMatchObject({ viewMode: "write", showSyntax: false });
    loadMock.mockResolvedValue(storedSnapshot());

    renderHook(() => useWebWorkspacePersistence(true));

    await waitFor(() => expect(useWorkspaceState.getState().showSyntax).toBe(true));
    expect(useWorkspaceState.getState().viewMode).toBe("write");
    expect(localStorage.getItem("markora:show-syntax")).toBe("1");
    localStorage.clear();
  });

  it("does not overwrite the stored snapshot before it has been loaded", async () => {
    let resolveLoad: (snapshot: WorkspaceSnapshot | null) => void = () => {};
    loadMock.mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)));

    renderHook(() => useWebWorkspacePersistence(true));

    // Load is still pending: persisting the empty initial state here would destroy the stored data.
    expect(saveMock).not.toHaveBeenCalled();

    resolveLoad(storedSnapshot());

    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    const savedIds = saveMock.mock.calls.flatMap(([snapshot]) => snapshot.projects.map((project) => project.id));
    expect(savedIds).toEqual(["stored-project"]);
    expect(useDocumentStore.getState().activeProjectId).toBe("stored-project");
  });

  it("starts saving once load finds nothing stored", async () => {
    loadMock.mockResolvedValue(null);

    renderHook(() => useWebWorkspacePersistence(true));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
  });

  it("starts saving even if loading fails", async () => {
    loadMock.mockRejectedValue(new Error("idb unavailable"));

    renderHook(() => useWebWorkspacePersistence(true));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
  });

  it("does nothing off the web platform", () => {
    renderHook(() => useWebWorkspacePersistence(false));

    expect(loadMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
