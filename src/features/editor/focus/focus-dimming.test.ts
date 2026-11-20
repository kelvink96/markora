import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { buildFocusDecorations, currentParagraphLines, focusDimming } from "./focus-dimming";

/** A state whose selection head sits at the start of `line` (1-based), or `column` characters into it. */
function stateAtLine(doc: string, line: number, column = 0, anchorLine = line) {
  const probe = EditorState.create({ doc });
  const head = probe.doc.line(line).from + column;
  const anchor = probe.doc.line(anchorLine).from;
  return EditorState.create({ doc, selection: { anchor, head } });
}

/** The 1-based numbers of the lines that carry a dim decoration. */
function dimmedLines(state: EditorState, ranges?: Array<{ from: number; to: number }>) {
  const set = buildFocusDecorations(state, ranges ?? [{ from: 0, to: state.doc.length }]);
  const lines: number[] = [];
  set.between(0, state.doc.length, (from) => {
    lines.push(state.doc.lineAt(from).number);
  });
  return lines;
}

const TWO = "a\nb\n\nc\nd";

describe("currentParagraphLines", () => {
  it("is the run of non-blank lines around the cursor", () => {
    expect(currentParagraphLines(stateAtLine(TWO, 2, 1))).toEqual({ fromLine: 1, toLine: 2 });
    expect(currentParagraphLines(stateAtLine(TWO, 4))).toEqual({ fromLine: 4, toLine: 5 });
  });

  it("handles the very start and the very end of the document", () => {
    expect(currentParagraphLines(stateAtLine(TWO, 1))).toEqual({ fromLine: 1, toLine: 2 });
    expect(currentParagraphLines(stateAtLine(TWO, 5, 1))).toEqual({ fromLine: 4, toLine: 5 });
  });

  it("has no current paragraph on a blank line", () => {
    expect(currentParagraphLines(stateAtLine(TWO, 3))).toBeNull();
    expect(currentParagraphLines(stateAtLine("", 1))).toBeNull();
  });

  it("counts a whitespace-only line as blank", () => {
    expect(currentParagraphLines(stateAtLine("a\n  \t\nb", 1))).toEqual({ fromLine: 1, toLine: 1 });
    expect(currentParagraphLines(stateAtLine("a\n  \t\nb", 2))).toBeNull();
  });

  it("is the whole document when it is one paragraph", () => {
    expect(currentParagraphLines(stateAtLine("hello", 1, 3))).toEqual({ fromLine: 1, toLine: 1 });
    expect(currentParagraphLines(stateAtLine("a\nb\nc", 2))).toEqual({ fromLine: 1, toLine: 3 });
  });

  it("follows the selection head when a selection spans paragraphs", () => {
    expect(currentParagraphLines(stateAtLine(TWO, 4, 0, 1))).toEqual({ fromLine: 4, toLine: 5 });
    expect(currentParagraphLines(stateAtLine(TWO, 1, 0, 4))).toEqual({ fromLine: 1, toLine: 2 });
  });

  it("treats \\r\\n documents like \\n ones", () => {
    const crlf = "a\r\nb\r\n\r\nc";
    expect(currentParagraphLines(stateAtLine(crlf, 1))).toEqual({ fromLine: 1, toLine: 2 });
    expect(currentParagraphLines(stateAtLine(crlf, 3))).toBeNull();
    expect(currentParagraphLines(stateAtLine(crlf, 4))).toEqual({ fromLine: 4, toLine: 4 });
  });
});

describe("buildFocusDecorations", () => {
  it("dims every non-blank line outside the current paragraph", () => {
    expect(dimmedLines(stateAtLine(TWO, 4))).toEqual([1, 2]);
    expect(dimmedLines(stateAtLine(TWO, 1))).toEqual([4, 5]);
  });

  it("dims every paragraph while the cursor is on a blank line", () => {
    expect(dimmedLines(stateAtLine(TWO, 3))).toEqual([1, 2, 4, 5]);
  });

  it("leaves blank lines alone, since there is nothing to fade", () => {
    expect(dimmedLines(stateAtLine("a\n\n\nb", 1))).toEqual([4]);
  });

  it("only touches lines inside the ranges it is given", () => {
    const state = stateAtLine(TWO, 4);
    const lineEnd = (n: number) => state.doc.line(n).to;

    expect(dimmedLines(state, [{ from: 0, to: lineEnd(1) }])).toEqual([1]);
    expect(dimmedLines(state, [{ from: state.doc.line(4).from, to: state.doc.length }])).toEqual([]);
  });

  it("produces nothing for an empty document", () => {
    expect(dimmedLines(stateAtLine("", 1))).toEqual([]);
  });
});

describe("focusDimming extension", () => {
  const views: EditorView[] = [];

  function mount(doc: string, anchor: number) {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const view = new EditorView({
      parent,
      state: EditorState.create({ doc, selection: { anchor }, extensions: [focusDimming()] }),
    });
    views.push(view);
    return view;
  }

  const dimmedDomLines = (view: EditorView) =>
    [...view.dom.querySelectorAll(".cm-line")].flatMap((line, index) =>
      line.classList.contains("cm-focus-dim") ? [index + 1] : [],
    );

  afterEach(() => {
    while (views.length) {
      const view = views.pop()!;
      view.dom.parentElement?.remove();
      view.destroy();
    }
  });

  it("fades the other paragraphs and moves with the cursor", () => {
    const doc = "one\n\ntwo\n\nthree";
    const view = mount(doc, doc.indexOf("two"));
    expect(dimmedDomLines(view)).toEqual([1, 5]);

    view.dispatch({ selection: { anchor: doc.length } });
    expect(dimmedDomLines(view)).toEqual([1, 3]);
  });

  it("follows edits: typing a blank line splits a paragraph in two", () => {
    const view = mount("alpha beta", 0);
    expect(dimmedDomLines(view)).toEqual([]);

    view.dispatch({ changes: { from: 5, insert: "\n\n" }, selection: { anchor: 8 } });

    expect(view.state.doc.toString()).toBe("alpha\n\n beta");
    expect(dimmedDomLines(view)).toEqual([1]);
  });

  it("never changes the document", () => {
    const doc = "one\n\ntwo";
    const view = mount(doc, 0);
    view.dispatch({ selection: { anchor: doc.length } });
    expect(view.state.doc.toString()).toBe(doc);
  });
});
