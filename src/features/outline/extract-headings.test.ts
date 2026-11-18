import { describe, expect, it } from "vitest";
import { extractHeadings, findActiveHeadingIndex } from "./extract-headings";

describe("extractHeadings", () => {
  it("lists headings with their level, text and line", () => {
    const headings = extractHeadings("# Title\n\ntext\n\n## Section\n\n### Deep\n");

    expect(headings).toEqual([
      { index: 0, level: 1, text: "Title", line: 1 },
      { index: 1, level: 2, text: "Section", line: 5 },
      { index: 2, level: 3, text: "Deep", line: 7 },
    ]);
  });

  it("handles all six levels", () => {
    const headings = extractHeadings("# 1\n## 2\n### 3\n#### 4\n##### 5\n###### 6");

    expect(headings.map((heading) => heading.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("returns nothing for a document without headings", () => {
    expect(extractHeadings("just text\n\nmore text")).toEqual([]);
    expect(extractHeadings("")).toEqual([]);
  });

  it("ignores things that look like headings but aren't", () => {
    expect(extractHeadings("#hashtag\n####### seven\n#\n# \nnot # a heading")).toEqual([]);
  });

  it("ignores indented code (four or more spaces) but allows up to three", () => {
    expect(extractHeadings("    # code")).toEqual([]);
    expect(extractHeadings("   # Fine")).toHaveLength(1);
  });

  it("skips lines inside fenced code blocks, backtick or tilde", () => {
    const markdown = "```bash\n# a comment\n```\n\n~~~\n# another\n~~~\n\n# Real";

    expect(extractHeadings(markdown).map((heading) => heading.text)).toEqual(["Real"]);
  });

  it("is not confused by a different fence character inside a fence", () => {
    const markdown = "```\n~~~\n# still code\n```\n# Heading";

    expect(extractHeadings(markdown).map((heading) => heading.text)).toEqual(["Heading"]);
  });

  it("removes trailing hashes and simple markdown from the text", () => {
    const headings = extractHeadings("## **Bold** and `code` and [a link](https://x.test) ##");

    expect(headings[0].text).toBe("Bold and code and a link");
  });

  it("counts lines correctly with Windows line endings", () => {
    const headings = extractHeadings("# One\r\n\r\n## Two\r\n");

    expect(headings.map((heading) => heading.line)).toEqual([1, 3]);
  });

  it("numbers headings in order, matching the nth heading in the rendered preview", () => {
    expect(extractHeadings("# A\n## B\n# C").map((heading) => heading.index)).toEqual([0, 1, 2]);
  });
});

describe("findActiveHeadingIndex", () => {
  const headings = extractHeadings("intro\n\n# One\n\ntext\n\n## Two\n\ntext\n\n# Three\n");

  it("is the last heading at or above the cursor line", () => {
    expect(findActiveHeadingIndex(headings, 3)).toBe(0); // on the heading itself
    expect(findActiveHeadingIndex(headings, 5)).toBe(0);
    expect(findActiveHeadingIndex(headings, 7)).toBe(1);
    expect(findActiveHeadingIndex(headings, 99)).toBe(2);
  });

  it("is -1 before the first heading", () => {
    expect(findActiveHeadingIndex(headings, 1)).toBe(-1);
  });

  it("is -1 when there are no headings", () => {
    expect(findActiveHeadingIndex([], 5)).toBe(-1);
  });
});
