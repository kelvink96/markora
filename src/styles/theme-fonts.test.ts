import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(import.meta.dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(path.join(rootDirectory, ...parts), "utf8");

describe("theme fonts", () => {
  it("loads the typography stack from Google Fonts", () => {
    const indexHtml = read("index.html");

    expect(indexHtml).toContain("fonts.googleapis.com");
    expect(indexHtml).toContain("family=Geist");
    expect(indexHtml).toContain("family=IBM+Plex+Mono");
    expect(indexHtml).toContain("family=Source+Serif+4");
  });

  it("uses Geist for the interface, Plex Mono for the editor and Source Serif for the preview", () => {
    const tailwindCss = read("src", "styles", "tailwind.css");

    expect(tailwindCss).toContain('--font-sans: "Geist"');
    expect(tailwindCss).toContain('--font-mono: "IBM Plex Mono"');
    expect(tailwindCss).toContain('--font-serif: "Source Serif 4"');
  });
});

describe("theme wiring", () => {
  const tailwindCss = read("src", "styles", "tailwind.css");

  it("keys dark mode off the .theme-dark class the app sets, not the OS", () => {
    expect(tailwindCss).toContain("@custom-variant dark");
    expect(tailwindCss).toContain(".theme-dark");
  });

  it("bridges every token the components use to a Tailwind colour", () => {
    for (const token of ["background", "foreground", "card", "popover", "primary", "muted", "accent", "border", "ring", "editor", "preview"]) {
      expect(tailwindCss).toContain(`--color-${token}: var(--${token})`);
    }
  });

  it("turns off decorative backgrounds in high contrast", () => {
    expect(tailwindCss).toContain('[data-color-scheme="high-contrast"] body');
  });

  it("respects the OS reduced-motion setting", () => {
    expect(tailwindCss).toContain("prefers-reduced-motion: reduce");
  });
});
