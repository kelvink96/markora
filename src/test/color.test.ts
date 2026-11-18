import { describe, expect, it } from "vitest";
import { contrastRatio, parseOklch } from "./color";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colours", () => {
    expect(contrastRatio(parseOklch("oklch(0 0 0)"), parseOklch("oklch(1 0 0)"))).toBeCloseTo(21, 0);
    expect(contrastRatio(parseOklch("oklch(0.5 0.1 200)"), parseOklch("oklch(0.5 0.1 200)"))).toBe(1);
  });

  it("is symmetric", () => {
    const a = parseOklch("oklch(0.5 0.22 280)");
    const b = parseOklch("oklch(0.985 0.006 275)");
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });

  it("matches a known pair: mid grey (#777) on white is about 4.48:1", () => {
    // #777777 is oklch(0.5695 0 0) (sRGB grey, no chroma).
    expect(contrastRatio(parseOklch("oklch(0.5695 0 0)"), parseOklch("oklch(1 0 0)"))).toBeCloseTo(4.48, 1);
  });

  it("rejects colours it can't read, such as ones with alpha", () => {
    expect(() => parseOklch("oklch(0.5 0.1 200 / 50%)")).toThrow();
    expect(() => parseOklch("#fff")).toThrow();
  });
});
