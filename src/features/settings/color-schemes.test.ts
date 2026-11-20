import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COLOR_SCHEMES, COLOR_SCHEME_IDS } from "./color-schemes";

describe("COLOR_SCHEMES", () => {
  it("lists every scheme once, with the names Settings, the menus and the palette all show", () => {
    expect(COLOR_SCHEMES.map((scheme) => scheme.name)).toEqual(["Aurora", "Ember", "High Contrast", "Moss", "Frost", "Rosé", "Ink"]);
    expect(new Set(COLOR_SCHEME_IDS).size).toBe(COLOR_SCHEMES.length);
  });

  it("lists Aurora first, keeping its saved id", () => {
    expect(COLOR_SCHEME_IDS[0]).toBe("standard");
  });

  it("gives each scheme a description, search keywords and a window colour for both modes", () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.description.length).toBeGreaterThan(0);
      expect(scheme.keywords.length).toBeGreaterThan(0);
      expect(scheme.themeColor.light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(scheme.themeColor.dark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  // The settings file is read by Rust too, and its enum rejects an id it doesn't know, so the two
  // lists must not drift apart. (serde renames the variants to kebab-case.)
  it("matches the colour schemes the Rust settings file accepts", () => {
    const rust = readFileSync(path.resolve(import.meta.dirname, "../../../src-tauri/src/commands/settings.rs"), "utf8");
    const body = /pub enum ColorScheme \{([^}]*)\}/.exec(rust)?.[1] ?? "";
    const variants = body
      .split(",")
      .map((variant) => variant.trim())
      .filter(Boolean)
      .map((variant) => variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase());

    expect(variants).toEqual([...COLOR_SCHEME_IDS]);
  });
});
