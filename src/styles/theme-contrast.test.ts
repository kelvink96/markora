import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseOklch } from "../test/color";

// The palettes live in themes.css; this checks them the way a reviewer would, so a colour
// tweak that breaks readability fails here instead of shipping.
const css = readFileSync(path.resolve(import.meta.dirname, "themes.css"), "utf8");

function parseBlocks() {
  const blocks = new Map<string, Map<string, string>>();
  for (const [, selector, body] of css.matchAll(/([^{}/]+)\{([^}]*)\}/g)) {
    const tokens = new Map<string, string>();
    for (const [, name, value] of body.matchAll(/--([a-z-]+)\s*:\s*([^;]+);/g)) {
      tokens.set(name, value.trim());
    }
    // A block can serve several selectors (:root and a scoped swatch), so register each one.
    for (const single of selector.split(",")) blocks.set(single.trim(), tokens);
  }
  return blocks;
}

const blocks = parseBlocks();

const THEMES = [
  ["Aurora light", ":root"],
  ["Aurora dark", ":root.theme-dark"],
  ["Ember light", ':root[data-color-scheme="sepia"]'],
  ["Ember dark", ':root[data-color-scheme="sepia"].theme-dark'],
  ["High contrast light", ':root[data-color-scheme="high-contrast"]'],
  ["High contrast dark", ':root[data-color-scheme="high-contrast"].theme-dark'],
] as const;

const REQUIRED_TOKENS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring",
  "editor", "preview", "syntax-heading", "syntax-emphasis", "syntax-link", "syntax-code",
  "syntax-quote", "syntax-marker", "brand-from", "brand-to",
];

// [foreground token, background token, minimum ratio]. 4.5 is WCAG AA for text; 3 is for
// non-text UI such as focus rings.
const TEXT = 4.5;
const UI = 3;
const PAIRS: Array<[string, string, number]> = [
  ["foreground", "background", TEXT],
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["muted-foreground", "background", TEXT],
  ["muted-foreground", "card", TEXT],
  ["muted-foreground", "muted", TEXT],
  ["muted-foreground", "popover", TEXT],
  ["muted-foreground", "preview", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["destructive-foreground", "destructive", TEXT],
  ["primary", "background", TEXT], // primary used as link or label text
  ["primary", "card", TEXT],
  ["destructive", "background", TEXT], // destructive used as error text
  ["destructive", "card", TEXT],
  ["foreground", "editor", TEXT],
  ["foreground", "preview", TEXT],
  ["syntax-heading", "editor", TEXT],
  ["syntax-emphasis", "editor", TEXT],
  ["syntax-link", "editor", TEXT],
  ["syntax-code", "editor", TEXT],
  ["syntax-quote", "editor", TEXT],
  ["syntax-marker", "editor", UI], // markdown punctuation: dimmer on purpose, still visible
  ["ring", "background", UI],
  ["ring", "card", UI],
];

describe("theme palettes", () => {
  it("lets any element preview a scheme through data-swatch attributes (used by the settings swatches)", () => {
    for (const scheme of ["standard", "sepia", "high-contrast"]) {
      for (const mode of ["light", "dark"]) {
        expect(blocks.has(`[data-swatch-scheme="${scheme}"][data-swatch-mode="${mode}"]`)).toBe(true);
      }
    }
  });

  it.each(THEMES)("%s is defined in themes.css", (_name, selector) => {
    expect(blocks.has(selector)).toBe(true);
  });

  it.each(THEMES)("%s defines every token (a missing one would inherit from the wrong theme)", (_name, selector) => {
    const tokens = blocks.get(selector)!;
    expect(REQUIRED_TOKENS.filter((token) => !tokens.has(token))).toEqual([]);
  });

  describe.each(THEMES)("%s contrast", (_name, selector) => {
    const tokens = blocks.get(selector)!;
    const colour = (token: string) => parseOklch(tokens.get(token)!);

    it.each(PAIRS)("%s on %s is at least %s:1", (foreground, background, minimum) => {
      expect(contrastRatio(colour(foreground), colour(background))).toBeGreaterThanOrEqual(minimum);
    });
  });

  it.each(THEMES.filter(([name]) => name.startsWith("High contrast")))(
    "%s has form-control borders that meet the 3:1 non-text contrast rule",
    (_name, selector) => {
      const tokens = blocks.get(selector)!;
      expect(
        contrastRatio(parseOklch(tokens.get("input")!), parseOklch(tokens.get("background")!)),
      ).toBeGreaterThanOrEqual(UI);
    },
  );
});
