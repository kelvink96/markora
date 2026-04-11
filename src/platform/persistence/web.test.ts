import { afterEach, describe, expect, it } from "vitest";
import {
  __resetWorkspacePersistenceForTests,
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "./web";

const snapshot: WorkspaceSnapshot = {
  version: 1,
  projects: [
    {
      id: "project-1",
      name: "Project 1",
      documents: [{ id: "document-1", content: "# Hello", filePath: null, isDirty: false }],
      activeDocumentId: "document-1",
    },
  ],
  activeProjectId: "project-1",
  recentDocuments: [],
};

describe("web workspace persistence", () => {
  afterEach(() => {
    __resetWorkspacePersistenceForTests();
  });

  it("saves and reloads snapshots when IndexedDB is unavailable", async () => {
    const originalIndexedDb = globalThis.indexedDB;
    // @ts-expect-error test override
    globalThis.indexedDB = undefined;

    await saveWorkspaceSnapshot(snapshot);
    await expect(loadWorkspaceSnapshot()).resolves.toEqual(snapshot);

    globalThis.indexedDB = originalIndexedDb;
  });

  it("returns null when no snapshot has been saved", async () => {
    const originalIndexedDb = globalThis.indexedDB;
    // @ts-expect-error test override
    globalThis.indexedDB = undefined;

    await expect(loadWorkspaceSnapshot()).resolves.toBeNull();

    globalThis.indexedDB = originalIndexedDb;
  });
});
