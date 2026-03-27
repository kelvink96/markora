import { beforeEach, describe, expect, it } from "vitest";
import { useDocumentStore } from "./document";

describe("DocumentStore", () => {
  beforeEach(() => {
    // Reset the store before each test so cases do not leak state into one another.
    useDocumentStore.setState({
      content: "",
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
    useDocumentStore.getState().setContent("old");
    useDocumentStore.getState().setFilePath("/old.md");
    useDocumentStore.getState().newDocument();
    const { content, filePath, isDirty } = useDocumentStore.getState();
    expect(content).toBe("");
    expect(filePath).toBeNull();
    expect(isDirty).toBe(false);
  });
});
