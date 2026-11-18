import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// jsdom doesn't apply stylesheets, so read the CSS directly (same approach as preview-styles).
const compatCss = readFileSync(path.resolve(import.meta.dirname, "compat.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

function declarationsFor(selector: string): string {
  return [...compatCss.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(",").some((part) => part.trim() === selector))
    .map(([, , body]) => body)
    .join("\n");
}

describe("editor styles", () => {
  it("leaves font size and line height to the settings-driven CodeMirror theme (#13)", () => {
    // `.editor-pane .cm-editor` outranks CodeMirror's own theme selectors, so anything set
    // here silently wins over the user's Editor font size / line spacing settings.
    const editor = declarationsFor(".editor-pane .cm-editor");

    expect(editor).not.toMatch(/font-size\s*:/);
    expect(editor).not.toMatch(/line-height\s*:/);
  });
});
