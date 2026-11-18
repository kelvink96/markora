import { describe, expect, it } from "vitest";
import { getDocumentExportName, getDocumentTitle } from "./document-names";

describe("getDocumentExportName", () => {
  it("uses the file name for saved documents on any platform", () => {
    expect(getDocumentExportName("D:\\notes\\today.md", "")).toBe("today.md");
    expect(getDocumentExportName("/notes/today.md", "")).toBe("today.md");
  });

  it("slugs the first heading for unsaved documents", () => {
    expect(getDocumentExportName(null, "\n\n# My First Note\n\nbody")).toBe("my-first-note.md");
  });

  it("strips characters that are invalid in file names", () => {
    expect(getDocumentExportName(null, 'Plan: "v2" <draft>?')).toBe("plan-v2-draft.md");
  });

  it("falls back to untitled.md when there is nothing to name it by", () => {
    expect(getDocumentExportName(null, "")).toBe("untitled.md");
    expect(getDocumentExportName(null, "   \n  ")).toBe("untitled.md");
    expect(getDocumentExportName(null, "###")).toBe("untitled.md");
  });
});

describe("getDocumentTitle", () => {
  it("drops the .md extension", () => {
    expect(getDocumentTitle("/notes/Today.MD", "")).toBe("Today");
    expect(getDocumentTitle(null, "# Hello World")).toBe("hello-world");
  });
});
