import { describe, expect, it } from "vitest";
import { applyMarkdownToolbarAction } from "./markdown-toolbar-actions";

describe("markdown-toolbar-actions", () => {
  it("wraps a selection in bold markers", () => {
    const result = applyMarkdownToolbarAction("hello", 0, 5, "bold");
    expect(result.text).toBe("**hello**");
  });

  it("prefixes the current line as a heading", () => {
    const result = applyMarkdownToolbarAction("hello", 0, 5, "heading");
    expect(result.text).toBe("# hello");
  });

  it("inserts a markdown table snippet", () => {
    const result = applyMarkdownToolbarAction("", 0, 0, "table");
    expect(result.text).toContain("| Column | Value |");
  });
});
