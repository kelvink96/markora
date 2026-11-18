import { describe, expect, it } from "vitest";
import { createDocumentTab, createImportedProject, createProject } from "./factories";
import { recordRecent } from "./recents";
import { normalizeState, syncActiveProjectView } from "./view";
import type { DocumentState, DocumentTab } from "./types";

const doc = (id: string, overrides: Partial<DocumentTab> = {}): DocumentTab => ({
  id,
  content: "",
  filePath: null,
  isDirty: false,
  ...overrides,
});

describe("factories", () => {
  it("numbers new documents after the highest existing id, not the count", () => {
    expect(createDocumentTab([doc("document-2"), doc("document-7")]).id).toBe("document-8");
    expect(createDocumentTab([]).id).toBe("document-1");
  });

  it("ignores ids that don't follow the document-N pattern", () => {
    expect(createDocumentTab([doc("custom"), doc("document-3")]).id).toBe("document-4");
  });

  it("names projects by position when no name is given", () => {
    const existing = [createProject([], "A"), createProject([], "B")];
    expect(createProject(existing).name).toBe("Project 3");
    expect(createProject(existing, "  Notes ").name).toBe("Notes");
  });

  it("keeps file handles and the requested active document when importing", () => {
    const handle = { kind: "file" } as unknown as FileSystemFileHandle;
    const project = createImportedProject([], {
      name: "Imported",
      documents: [{ content: "a" }, { content: "b", handle }],
      activeDocumentId: "document-2",
    });

    expect(project.activeDocumentId).toBe("document-2");
    expect(project.documents[1].handle).toBe(handle);
  });

  it("falls back to an untitled document when importing nothing", () => {
    const project = createImportedProject([], { name: "Empty", documents: [] });
    expect(project.documents).toHaveLength(1);
    expect(project.documents[0].filePath).toBeNull();
  });
});

describe("recordRecent", () => {
  it("puts the newest entry first and removes the older entry for the same document", () => {
    const first = recordRecent([], "project-1", doc("document-1", { filePath: "/a/one.md" }));
    const second = recordRecent(first, "project-1", doc("document-2", { content: "# Two" }));
    const again = recordRecent(second, "project-1", doc("document-1", { filePath: "/a/one.md" }));

    expect(again.map((entry) => entry.documentId)).toEqual(["document-1", "document-2"]);
    expect(again.map((entry) => entry.title)).toEqual(["one.md", "Two"]);
  });

  it("keeps the same document id in different projects apart", () => {
    const entries = recordRecent(
      recordRecent([], "project-1", doc("document-1")),
      "project-2",
      doc("document-1"),
    );
    expect(entries).toHaveLength(2);
  });
});

describe("syncActiveProjectView", () => {
  it("mirrors the active project's active document into the flat fields", () => {
    const project = {
      id: "project-1",
      name: "P",
      documents: [doc("document-1", { content: "x" }), doc("document-2", { content: "y", isDirty: true })],
      activeDocumentId: "document-2",
    };

    const view = syncActiveProjectView([project], "project-1", []);

    expect(view).toMatchObject({ activeDocumentId: "document-2", content: "y", isDirty: true });
    expect(view.openDocuments).toHaveLength(2);
  });

  it("clears the flat fields when the project has no documents", () => {
    const project = { id: "project-1", name: "P", documents: [], activeDocumentId: "" };

    expect(syncActiveProjectView([project], "project-1", [])).toMatchObject({
      activeDocumentId: "",
      content: "",
      openDocuments: [],
    });
  });
});

describe("normalizeState", () => {
  const base: DocumentState = {
    content: "",
    filePath: null,
    isDirty: false,
    openDocuments: [],
    activeDocumentId: "",
    projects: [],
    activeProjectId: "",
    recentDocuments: [],
  };

  it("builds a project from flat fields when there are no projects yet", () => {
    const result = normalizeState({
      ...base,
      openDocuments: [doc("document-1", { content: "hi" })],
      activeDocumentId: "document-1",
    });

    expect(result.projects).toHaveLength(1);
    expect(result.content).toBe("hi");
  });

  it("pushes directly-set open documents back into the active project", () => {
    const project = { id: "project-1", name: "P", documents: [], activeDocumentId: "" };
    const result = normalizeState({
      ...base,
      projects: [project],
      activeProjectId: "project-1",
      openDocuments: [doc("document-1", { content: "set directly" })],
      activeDocumentId: "document-1",
    });

    expect(result.projects[0].documents).toHaveLength(1);
    expect(result.projects[0].activeDocumentId).toBe("document-1");
  });
});
