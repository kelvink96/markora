import { beforeEach, describe, expect, it } from "vitest";
import { useDocumentStore } from "./document";

const untitledStarterContent =
  "# Welcome to Markora\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview** as you type\n- Open and save `.md` files\n- Light and dark themes\n\n---\n\n## Quick Start\n\nUse this untitled document to sketch ideas, outlines, or notes before saving.\n\n### Writing Tips\n\n1. Start with a heading structure.\n2. Use lists to break down ideas.\n3. Add code blocks for snippets.\n4. Switch themes when reviewing contrast.\n\n### Sample Checklist\n\n- [ ] Draft the intro\n- [ ] Add key talking points\n- [ ] Review formatting\n- [ ] Save the file\n\n### Notes\n\n> Markora is built for focused writing with a live preview beside your editor.\n\n```ts\nfunction helloMarkora() {\n  return \"Write first, refine later.\";\n}\n```\n\n## Example Outline\n\n### Section One\n\nThis is a larger placeholder block so you can evaluate spacing, rhythm, scrolling, and preview rendering in a more realistic untitled state.\n\n### Section Two\n\nAdd paragraphs, lists, quotes, and code to see how the editor and preview feel with richer content before a document has been saved.\n";

describe("DocumentStore", () => {
  beforeEach(() => {
    // Reset the store before each test so cases do not leak state into one another.
    useDocumentStore.setState({
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
    useDocumentStore.getState().setContent("old");
    useDocumentStore.getState().setFilePath("/old.md");
    useDocumentStore.getState().newDocument();
    const { content, filePath, isDirty } = useDocumentStore.getState();
    expect(content).toBe(untitledStarterContent);
    expect(filePath).toBeNull();
    expect(isDirty).toBe(false);
  });
});
