import { describe, expect, it } from "vitest";
import { applyLineEnding, detectLineEnding, toLf } from "./line-endings";

describe("line endings", () => {
  it("detects the ending a file uses", () => {
    expect(detectLineEnding("a\r\nb\r\n")).toBe("\r\n");
    expect(detectLineEnding("a\nb\n")).toBe("\n");
  });

  it("defaults to LF when there is no line break to learn from", () => {
    expect(detectLineEnding("single line")).toBe("\n");
    expect(detectLineEnding("")).toBe("\n");
  });

  it("follows the first line break when a file mixes both", () => {
    expect(detectLineEnding("a\r\nb\nc")).toBe("\r\n");
    expect(detectLineEnding("a\nb\r\nc")).toBe("\n");
  });

  it("converts to LF, as the editor sees the text", () => {
    expect(toLf("a\r\nb\r\nc")).toBe("a\nb\nc");
    expect(toLf("a\nb")).toBe("a\nb");
  });

  it("applies an ending to LF text, without doubling existing ones", () => {
    expect(applyLineEnding("a\nb", "\r\n")).toBe("a\r\nb");
    expect(applyLineEnding("a\r\nb", "\r\n")).toBe("a\r\nb");
    expect(applyLineEnding("a\r\nb", "\n")).toBe("a\nb");
  });
});
