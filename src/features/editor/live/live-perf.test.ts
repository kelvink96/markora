import { markdown } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorSelection, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { buildLiveDecorations } from "./live-decorations";

/*
 * Perf check for very large documents. Live mode only walks the visible ranges, so the cost of a
 * rebuild (every cursor move) must not grow with document size. Numbers are logged so they can be
 * recorded in the PR; the budgets are deliberately loose to stay stable on slow CI machines.
 */

function largeDocument(lines: number) {
  const block = [
    "# Heading one",
    "",
    "Some paragraph text that goes on for a while to look like real prose.",
    "",
    "- item one",
    "- item two",
    "",
    "> a quoted line",
    "",
    "```ts",
    "const value = 1;",
    "```",
    "",
    "---",
    "",
  ];
  const out: string[] = [];
  while (out.length < lines) out.push(...block);
  return out.slice(0, lines).join("\n");
}

const time = (run: () => void) => {
  const start = performance.now();
  run();
  return performance.now() - start;
};

describe("Live decorations on a very large document", () => {
  const lineCount = 200_000;
  const doc = largeDocument(lineCount);
  const middle = Math.floor(doc.length / 2);
  const initial = EditorState.create({
    doc,
    selection: EditorSelection.single(middle),
    extensions: [markdown()],
  });
  let parsed: unknown = null;
  let state = initial;
  const parseMs = time(() => {
    parsed = ensureSyntaxTree(initial, initial.doc.length, 60_000);
    // The parsed tree reaches the state through a transaction, as it does in a running editor.
    state = initial.update({}).state;
  });
  // Roughly a tall screen of lines around the cursor.
  const viewport = { from: middle, to: Math.min(doc.length, middle + 3_000) };

  it("rebuilds the visible range in a few milliseconds, independent of document size", () => {
    buildLiveDecorations(state, [viewport]); // warm up
    const runs = 20;
    const visibleMs = time(() => {
      for (let i = 0; i < runs; i++) buildLiveDecorations(state, [viewport]);
    }) / runs;
    const wholeMs = time(() => buildLiveDecorations(state, [{ from: 0, to: doc.length }]));

    console.log(
      `[live perf] ${lineCount} lines, ${(doc.length / 1e6).toFixed(1)} MB: full parse ${parseMs.toFixed(0)} ms, ` +
        `visible-range rebuild ${visibleMs.toFixed(2)} ms/run, whole-document rebuild (for contrast) ${wholeMs.toFixed(0)} ms`,
    );

    expect(parsed).not.toBeNull();
    expect(buildLiveDecorations(state, [viewport]).size).toBeGreaterThan(100);
    expect(visibleMs).toBeLessThan(50);
    expect(visibleMs * 20).toBeLessThan(wholeMs);
  });
});
