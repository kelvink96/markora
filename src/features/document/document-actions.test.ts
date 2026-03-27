import { describe, expect, it } from "vitest";
import { getDisplayFileName, getWordCount } from "./document-actions";

describe("document-actions", () => {
  it("returns Untitled when no file path exists", () => {
    expect(getDisplayFileName(null)).toBe("Untitled");
  });

  it("returns the basename for windows paths", () => {
    expect(getDisplayFileName("C:\\notes\\draft.md")).toBe("draft.md");
  });

  it("counts words from markdown content", () => {
    expect(getWordCount("# Hello world from Markora")).toBe(4);
  });
});
