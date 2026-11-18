import { describe, expect, it } from "vitest";
import { getDocumentExportName, getDocumentTitle, getFirstHeading } from "./document-names";

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

describe("getFirstHeading", () => {
  it("finds the first heading at any level, ignoring trailing hashes", () => {
    expect(getFirstHeading("intro\n\n## Quarterly Notes ##\n")).toBe("Quarterly Notes");
    expect(getFirstHeading("###### Deep")).toBe("Deep");
  });

  it("returns the first one when there are several", () => {
    expect(getFirstHeading("# One\n\n# Two")).toBe("One");
  });

  it("returns null when there is no heading", () => {
    expect(getFirstHeading("just text\n\nmore")).toBeNull();
    expect(getFirstHeading("")).toBeNull();
  });

  it("is not fooled by a # that isn't a heading", () => {
    expect(getFirstHeading("#hashtag\nnot a heading")).toBeNull();
    expect(getFirstHeading("    # indented code")).toBeNull();
  });

  it("skips comments inside fenced code blocks", () => {
    expect(getFirstHeading("```bash\n# a comment\n```\n\n# Real title")).toBe("Real title");
  });
});
