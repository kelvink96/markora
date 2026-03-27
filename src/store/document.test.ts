import { beforeEach, describe, expect, it } from "vitest";
import { untitledStarterContent, useDocumentStore } from "./document";

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
});
