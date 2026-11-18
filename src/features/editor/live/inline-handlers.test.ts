import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorSelection, EditorState } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { buildLiveDecorations } from "./live-decorations";

interface Found {
  kind: "mark" | "hidden";
  from: number;
  to: number;
  class?: string;
}

function build(doc: string, anchor?: number, head?: number): Found[] {
  const selection = anchor === undefined ? undefined : EditorSelection.single(anchor, head ?? anchor);
  const state = EditorState.create({ doc, selection, extensions: [markdown({ base: markdownLanguage })] });
  ensureSyntaxTree(state, state.doc.length, 5000);
  const set: DecorationSet = buildLiveDecorations(state, [{ from: 0, to: state.doc.length }]);
  const found: Found[] = [];
  set.between(0, doc.length, (from, to, value) => {
    const cls = value.spec.class as string | undefined;
    if (from === to) return;
    found.push(cls ? { kind: "mark", from, to, class: cls } : { kind: "hidden", from, to });
  });
  return found;
}

const hidden = (found: Found[]) => found.filter((f) => f.kind === "hidden").map((f) => [f.from, f.to]);
const marks = (found: Found[], cls: string) =>
  found.filter((f) => f.class === cls).map((f) => [f.from, f.to]).sort((a, b) => a[0] - b[0]);
const AWAY = "\n\nplain"; // the caret goes on this line so the first line renders

describe("emphasis", () => {
  it("styles bold and hides its markers", () => {
    const doc = `a **bold** b${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-strong")).toEqual([[2, 10]]);
    expect(hidden(found)).toEqual([[2, 4], [8, 10]]);
  });

  it("styles italic with * and _", () => {
    const doc = `*one* and _two_${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-em")).toEqual([[0, 5], [10, 15]]);
    expect(hidden(found)).toEqual([[0, 1], [4, 5], [10, 11], [14, 15]]);
  });

  it("styles strikethrough", () => {
    const doc = `~~gone~~${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-strike")).toEqual([[0, 8]]);
    expect(hidden(found)).toEqual([[0, 2], [6, 8]]);
  });

  it("handles nested marks: bold containing italic", () => {
    const doc = `**bold *and italic***${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-strong")).toEqual([[0, 21]]);
    expect(marks(found, "cm-live-em")).toEqual([[7, 19]]);
    expect(hidden(found)).toEqual([[0, 2], [7, 8], [18, 19], [19, 21]]);
  });

  it("handles adjacent marks", () => {
    const doc = `**a***b*${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-strong")).toEqual([[0, 5]]);
    expect(marks(found, "cm-live-em")).toEqual([[5, 8]]);
  });

  it("styles each line of a mark that wraps across lines", () => {
    const doc = `**one\ntwo**\n\nplain`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-strong")).toEqual([[0, 5], [6, 11]]);
  });
});

describe("inline code", () => {
  it("styles the code and hides the backticks", () => {
    const doc = `use \`npm run\` now${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-code-inline")).toEqual([[4, 13]]);
    expect(hidden(found)).toEqual([[4, 5], [12, 13]]);
  });

  it("does not render marks inside code that contains asterisks", () => {
    const doc = `\`a*b*c\` and \`**x**\`${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-em")).toEqual([]);
    expect(marks(found, "cm-live-strong")).toEqual([]);
    expect(hidden(found)).toEqual([[0, 1], [6, 7], [12, 13], [18, 19]]);
  });
});

describe("escapes", () => {
  it("hides the backslash of an escaped character and renders no emphasis", () => {
    const doc = `a \\*x\\* b${AWAY}`;
    const found = build(doc, doc.length);
    expect(hidden(found)).toEqual([[2, 3], [5, 6]]);
    expect(marks(found, "cm-live-em")).toEqual([]);
  });
});

describe("links", () => {
  it("styles the text as a link and hides brackets and the destination", () => {
    const doc = `see [docs](https://x.dev/a) ok${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-link")).toEqual([[5, 9]]);
    expect(hidden(found)).toEqual([[4, 5], [9, 27]]);
  });

  it("handles parentheses in the destination", () => {
    const doc = `[a](https://x.dev/a_(b)) z${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-link")).toEqual([[1, 2]]);
    expect(hidden(found)).toEqual([[0, 1], [2, 24]]);
  });

  it("styles emphasis inside link text", () => {
    const doc = `[**hi**](u)${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-link")).toEqual([[1, 7]]);
    expect(marks(found, "cm-live-strong")).toEqual([[1, 7]]);
  });

  it("renders an autolink as a link without the angle brackets", () => {
    const doc = `go <https://x.dev> ok${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-link")).toEqual([[4, 17]]);
    expect(hidden(found)).toEqual([[3, 4], [17, 18]]);
  });

  it("styles a bare URL without hiding anything", () => {
    const doc = `go https://x.dev ok${AWAY}`;
    const found = build(doc, doc.length);
    expect(marks(found, "cm-live-link")).toEqual([[3, 16]]);
    expect(hidden(found)).toEqual([]);
  });

  it("leaves images and reference links untouched", () => {
    const doc = `![alt](a.png) [ref][r]\n\n[r]: http://z${AWAY}`;
    const found = build(doc, doc.length);
    expect(hidden(found)).toEqual([]);
    expect(marks(found, "cm-live-link")).toEqual([]);
  });
});

describe("caret and selection", () => {
  const doc = `a **bold** [l](u) \`c\` \\*${AWAY}`;

  it("shows raw markdown wherever the caret sits on the line", () => {
    for (let caret = 0; caret <= doc.indexOf("\n"); caret++) {
      const found = build(doc, caret);
      expect(hidden(found), `caret ${caret}`).toEqual([]);
      expect(found.filter((f) => f.kind === "mark"), `caret ${caret}`).toEqual([]);
    }
  });

  it("reveals every line a multi-line selection touches", () => {
    const text = "**a**\n**b**\n**c**";
    const found = build(text, 2, 8);
    expect(hidden(found)).toEqual([[12, 14], [15, 17]]);
  });

  it("renders again when the caret leaves", () => {
    expect(hidden(build(doc, doc.length)).length).toBeGreaterThan(0);
  });
});
