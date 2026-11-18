import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// jsdom doesn't apply stylesheets, so these tests read the preview CSS directly.
const compatCss = readFileSync(path.resolve(import.meta.dirname, "compat.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Returns the declarations of every rule whose selector list includes `selector`. */
function declarationsFor(selector: string): string {
  const rules = compatCss.matchAll(/([^{}]+)\{([^}]*)\}/g);
  return [...rules]
    .filter(([, selectors]) => selectors.split(",").some((part) => part.trim() === selector))
    .map(([, , body]) => body)
    .join("\n");
}

describe("preview styles", () => {
  it("restores list markers that Tailwind preflight removes (#2)", () => {
    expect(declarationsFor(".preview-pane__content.prose ul")).toMatch(/list-style-type:\s*disc/);
    expect(declarationsFor(".preview-pane__content.prose ol")).toMatch(/list-style-type:\s*decimal/);
    expect(declarationsFor(".preview-pane__content.prose ul ul")).toMatch(/list-style-type:\s*circle/);
    expect(declarationsFor(".preview-pane__content.prose ul ul ul")).toMatch(/list-style-type:\s*square/);
  });

  it("keeps task list items free of bullets (#2)", () => {
    expect(
      declarationsFor(".preview-pane__content.prose li:has(> input[type=\"checkbox\"])"),
    ).toMatch(/list-style-type:\s*none/);
  });

  it("caps the preview line length for readability (#9)", () => {
    // Grow side padding instead of narrowing the box, so the preview surface stays full width.
    const content = declarationsFor(".preview-pane__content.prose");
    expect(content).toMatch(/padding-inline:\s*max\([^;]*100%\s*-\s*72ch/);
  });
});
