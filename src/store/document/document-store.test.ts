import { beforeEach, describe, expect, it } from "vitest";
import { selectHasUnsavedChanges, untitledStarterContent, useDocumentStore } from "./index";

describe("DocumentStore", () => {
  beforeEach(() => {
    // Reset the store before each test so cases do not leak state into one another.
    useDocumentStore.setState({
      openDocuments: [
        {
          id: "document-1",
          content: untitledStarterContent,
          filePath: null,
          isDirty: false,
        },
      ],
      activeDocumentId: "document-1",
      content: untitledStarterContent,
      filePath: null,
      isDirty: false,
    });
  });

  it("setContent marks the document dirty", () => {
    useDocumentStore.getState().setContent("# Hello");
    expect(useDocumentStore.getState().content).toBe("# Hello");
    expect(useDocumentStore.getState().isDirty).toBe(true);
  });

  // The editor reports every document swap back as a change, including the one a tab
  // switch causes. That echo carries the text the tab already has and is not an edit.
  it("switching to another tab does not mark it dirty when the editor echoes its text back", () => {
    const store = useDocumentStore.getState();
    store.openDocument({ content: "# Alpha", filePath: "/alpha.md", isDirty: false });
    store.openDocument({ content: "# Beta", filePath: "/beta.md", isDirty: false });

    // What the editor does after the swap to beta: report its unchanged text.
    useDocumentStore.getState().setContent("# Beta");

    const beta = useDocumentStore.getState().openDocuments.find((d) => d.filePath === "/beta.md");
    expect(beta?.isDirty).toBe(false);
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("setContent keeps an already dirty document dirty when the text is unchanged", () => {
    useDocumentStore.getState().setContent("# Edited");
    useDocumentStore.getState().setContent("# Edited");
    expect(useDocumentStore.getState().isDirty).toBe(true);
  });

  it("opening a file with Windows line endings leaves it clean once the editor reports its text", () => {
    useDocumentStore.getState().openDocument({ content: "# Title\r\n\r\nBody\r\n", filePath: "/win.md", isDirty: false });

    // CodeMirror holds the text with plain \n and reports it that way.
    useDocumentStore.getState().setContent("# Title\n\nBody\n");

    expect(useDocumentStore.getState().isDirty).toBe(false);
    expect(useDocumentStore.getState().content).toBe("# Title\r\n\r\nBody\r\n");
  });

  it("an edit to a file with Windows line endings keeps them", () => {
    useDocumentStore.getState().openDocument({ content: "# Title\r\n\r\nBody\r\n", filePath: "/win.md", isDirty: false });

    useDocumentStore.getState().setContent("# Title\n\nBody, edited\nMore\n");

    expect(useDocumentStore.getState().isDirty).toBe(true);
    expect(useDocumentStore.getState().content).toBe("# Title\r\n\r\nBody, edited\r\nMore\r\n");
  });

  it("an edit to a file with Unix line endings stays Unix", () => {
    useDocumentStore.getState().openDocument({ content: "a\nb\n", filePath: "/unix.md", isDirty: false });

    useDocumentStore.getState().setContent("a\nb\nc\n");

    expect(useDocumentStore.getState().content).toBe("a\nb\nc\n");
  });

  it("markClean clears the dirty flag", () => {
    useDocumentStore.getState().setContent("# Hello");
    useDocumentStore.getState().markClean();
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("setFilePath stores the path without affecting dirty", () => {
    useDocumentStore.getState().setFilePath("/home/user/notes.md");
    expect(useDocumentStore.getState().filePath).toBe("/home/user/notes.md");
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("newDocument resets all state", () => {
    const originalId = useDocumentStore.getState().activeDocumentId;
    useDocumentStore.getState().newDocument();
    const { activeDocumentId, content, filePath, isDirty, openDocuments } = useDocumentStore.getState();
    expect(activeDocumentId).not.toBe(originalId);
    expect(content).toBe(untitledStarterContent);
    expect(filePath).toBeNull();
    expect(isDirty).toBe(false);
    expect(openDocuments).toHaveLength(2);
  });

  it("tracks multiple documents and switches the active tab", () => {
    const firstId = useDocumentStore.getState().activeDocumentId;
    const secondId = useDocumentStore.getState().addDocument({
      content: "# Second",
      filePath: "D:\\notes\\second.md",
    });

    expect(useDocumentStore.getState().activeDocumentId).toBe(secondId);
    expect(useDocumentStore.getState().content).toBe("# Second");

    useDocumentStore.getState().selectDocument(firstId);

    expect(useDocumentStore.getState().activeDocumentId).toBe(firstId);
    expect(useDocumentStore.getState().content).toBe(untitledStarterContent);
  });

  it("reuses an already open file tab instead of creating a duplicate", () => {
    const existingId = useDocumentStore.getState().addDocument({
      content: "# Existing",
      filePath: "D:\\notes\\existing.md",
      isDirty: false,
    });

    const reopenedId = useDocumentStore.getState().openDocument({
      content: "# Fresh from disk",
      filePath: "D:\\notes\\existing.md",
      isDirty: false,
    });

    expect(reopenedId).toBe(existingId);
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().activeDocumentId).toBe(existingId);
    expect(useDocumentStore.getState().content).toBe("# Fresh from disk");
  });

  it("closes the active tab and falls back to a remaining document", () => {
    const firstId = useDocumentStore.getState().activeDocumentId;
    const secondId = useDocumentStore.getState().addDocument({
      content: "# Second",
      filePath: "D:\\notes\\second.md",
    });

    useDocumentStore.getState().closeDocument(secondId);

    expect(useDocumentStore.getState().activeDocumentId).toBe(firstId);
    expect(useDocumentStore.getState().openDocuments).toHaveLength(1);
  });

  it("allows closing the last open tab and resets active document fields", () => {
    useDocumentStore.getState().closeDocument("document-1");

    expect(useDocumentStore.getState().openDocuments).toHaveLength(0);
    expect(useDocumentStore.getState().activeDocumentId).toBe("");
    expect(useDocumentStore.getState().content).toBe("");
    expect(useDocumentStore.getState().filePath).toBeNull();
    expect(useDocumentStore.getState().isDirty).toBe(false);
  });

  it("keeps dirty state isolated per tab", () => {
    const firstId = useDocumentStore.getState().activeDocumentId;
    const secondId = useDocumentStore.getState().addDocument({
      content: "# Second",
      filePath: "D:\\notes\\second.md",
    });

    useDocumentStore.getState().setContent("# Updated second");
    useDocumentStore.getState().selectDocument(firstId);

    expect(useDocumentStore.getState().isDirty).toBe(false);

    useDocumentStore.getState().selectDocument(secondId);
    expect(useDocumentStore.getState().isDirty).toBe(true);
    expect(useDocumentStore.getState().content).toBe("# Updated second");
  });

  it("supports multiple projects and switches the active project view", () => {
    const { createProject, addDocument, selectProject } = useDocumentStore.getState();

    const defaultProjectId = useDocumentStore.getState().activeProjectId;
    addDocument({ content: "# Default project doc", filePath: "D:\\notes\\default.md" });

    const secondProjectId = createProject("Work");
    addDocument({ content: "# Work doc", filePath: "D:\\notes\\work.md" });

    expect(useDocumentStore.getState().activeProjectId).toBe(secondProjectId);
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().content).toBe("# Work doc");

    selectProject(defaultProjectId);

    expect(useDocumentStore.getState().activeProjectId).toBe(defaultProjectId);
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().content).toBe("# Default project doc");
  });

  it("tracks recents across projects with the newest selection first", () => {
    const { createProject, addDocument, openDocument, selectProject } = useDocumentStore.getState();

    const defaultProjectId = useDocumentStore.getState().activeProjectId;
    const dailyId = openDocument({
      content: "# Daily",
      filePath: "D:\\notes\\daily.md",
      isDirty: false,
    });

    const workProjectId = createProject("Work");
    const specId = addDocument({
      content: "# Spec",
      filePath: "D:\\notes\\work-spec.md",
      isDirty: false,
    });

    selectProject(defaultProjectId);
    useDocumentStore.getState().selectDocument(dailyId);
    selectProject(workProjectId);
    useDocumentStore.getState().selectDocument(specId);

    expect(
      useDocumentStore
        .getState()
        .recentDocuments.slice(0, 2)
        .map((entry) => ({ projectId: entry.projectId, documentId: entry.documentId })),
    ).toEqual([
      { projectId: workProjectId, documentId: specId },
      { projectId: defaultProjectId, documentId: dailyId },
    ]);
  });

  it("imports a project and makes it active", () => {
    const projectId = useDocumentStore.getState().importProject({
      name: "Imported",
      documents: [
        { content: "# Imported note", filePath: "workspace/imported.md", isDirty: false },
        { content: "# Another", filePath: "workspace/another.md", isDirty: false },
      ],
    });

    expect(useDocumentStore.getState().activeProjectId).toBe(projectId);
    expect(useDocumentStore.getState().projects.find((project) => project.id === projectId)?.name).toBe(
      "Imported",
    );
    expect(useDocumentStore.getState().openDocuments).toHaveLength(2);
    expect(useDocumentStore.getState().content).toBe("# Imported note");
  });

  it("hydrates the workspace from a saved snapshot", () => {
    useDocumentStore.getState().hydrateWorkspace({
      projects: [
        {
          id: "project-9",
          name: "Hydrated",
          documents: [{ id: "document-3", content: "# Restored", filePath: "restored.md", isDirty: false }],
          activeDocumentId: "document-3",
        },
      ],
      activeProjectId: "project-9",
      recentDocuments: [
        {
          projectId: "project-9",
          documentId: "document-3",
          filePath: "restored.md",
          title: "restored.md",
          lastOpenedAt: 123,
        },
      ],
    });

    expect(useDocumentStore.getState().activeProjectId).toBe("project-9");
    expect(useDocumentStore.getState().content).toBe("# Restored");
    expect(useDocumentStore.getState().recentDocuments).toHaveLength(1);
  });
});

describe("DocumentStore ensureDocumentOpen (Scratch note)", () => {
  it("opens an unsaved Scratch note with the given content when no document is open", () => {
    useDocumentStore.getState().closeAllDocuments();

    useDocumentStore.getState().ensureDocumentOpen("# Template");

    const state = useDocumentStore.getState();
    expect(state.openDocuments).toHaveLength(1);
    expect(state.content).toBe("# Template");
    expect(state.filePath).toBeNull();
    expect(state.activeDocumentId).toBe(state.openDocuments[0].id);
  });

  it("creates no extra document when one is already open", () => {
    useDocumentStore.getState().closeAllDocuments();
    useDocumentStore.getState().openDocument({ content: "# Mine", filePath: "/mine.md" });
    const before = useDocumentStore.getState().openDocuments;

    useDocumentStore.getState().ensureDocumentOpen("# Template");

    const state = useDocumentStore.getState();
    expect(state.openDocuments).toEqual(before);
    expect(state.content).toBe("# Mine");
  });
});

describe("selectHasUnsavedChanges", () => {
  beforeEach(() => {
    useDocumentStore.getState().openDocument({ content: "# Saved", filePath: "/saved.md", isDirty: false });
  });

  it("is false when no open document is dirty", () => {
    expect(selectHasUnsavedChanges(useDocumentStore.getState())).toBe(false);
  });

  it("is true when any open document is dirty, even a background tab", () => {
    useDocumentStore.getState().openDocument({ content: "# Edited", filePath: "/edited.md", isDirty: true });
    useDocumentStore.getState().openDocument({ content: "# Clean", filePath: "/clean.md", isDirty: false });

    expect(selectHasUnsavedChanges(useDocumentStore.getState())).toBe(true);
  });
});
