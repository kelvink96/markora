import { history, redo, undo, undoDepth } from "@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { applySectionMove } from "./apply-section-move";

const D1 = "# Title\n\n## One\na\n\n## Two\nb\n\n## Three\nc\n";
const D1_ONE_TO_END = "# Title\n\n## Two\nb\n\n## Three\nc\n## One\na\n\n";
const D1_THREE_TO_ONE = "# Title\n\n## Three\nc\n## One\na\n\n## Two\nb\n\n";

const views: EditorView[] = [];
let docChangingUpdates = 0;

function mount(doc: string, selection: number | { anchor: number; head: number } = 0) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  docChangingUpdates = 0;
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: typeof selection === "number" ? { anchor: selection } : selection,
      extensions: [
        history(),
        EditorState.allowMultipleSelections.of(true),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) docChangingUpdates += 1;
        }),
      ],
    }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  while (views.length) {
    const view = views.pop()!;
    view.dom.parentElement?.remove();
    view.destroy();
  }
});

/** The text of the line the main cursor is on, and the line above it. */
function around(view: EditorView) {
  const line = view.state.doc.lineAt(view.state.selection.main.head);
  return { line: line.text, above: line.number > 1 ? view.state.doc.line(line.number - 1).text : null };
}

describe("applySectionMove", () => {
  it("moves the section in a single transaction and says so", () => {
    const view = mount(D1);

    expect(applySectionMove(view, 3, 1)).toBe(true);

    expect(view.state.doc.toString()).toBe(D1_THREE_TO_ONE);
    expect(docChangingUpdates).toBe(1);
  });

  it("is undone in one step, exactly, and redone in one step", () => {
    const view = mount(D1);

    applySectionMove(view, 1, 4);
    expect(view.state.doc.toString()).toBe(D1_ONE_TO_END);
    expect(undoDepth(view.state)).toBe(1);

    undo(view);
    expect(view.state.doc.toString()).toBe(D1);

    redo(view);
    expect(view.state.doc.toString()).toBe(D1_ONE_TO_END);
  });

  it("refuses a move that does nothing, leaving the text and the undo history alone", () => {
    const view = mount(D1);

    expect(applySectionMove(view, 1, 1)).toBe(false);
    expect(applySectionMove(view, 1, 2)).toBe(false);
    expect(applySectionMove(view, 9, 0)).toBe(false);

    expect(view.state.doc.toString()).toBe(D1);
    expect(undoDepth(view.state)).toBe(0);
    expect(docChangingUpdates).toBe(0);
  });

  it("works from the live document, not from headings seen earlier", () => {
    const view = mount(D1);
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "# X\nx\n# Y\ny\n" } });

    expect(applySectionMove(view, 1, 0)).toBe(true);

    expect(view.state.doc.toString()).toBe("# Y\ny\n# X\nx\n");
  });

  it("keeps a cursor inside the moved section on the same text", () => {
    const view = mount(D1, D1.indexOf("\na\n") + 1);

    applySectionMove(view, 1, 4);

    expect(view.state.doc.toString()).toBe(D1_ONE_TO_END);
    expect(around(view)).toEqual({ line: "a", above: "## One" });
  });

  it("keeps a selection inside the moved section selecting the same text", () => {
    const start = D1.indexOf("\na\n") + 1;
    const view = mount(D1, { anchor: start, head: start + 1 });

    applySectionMove(view, 1, 4);

    const { from, to } = view.state.selection.main;
    expect(view.state.sliceDoc(from, to)).toBe("a");
    expect(around(view).above).toBe("## One");
  });

  it("keeps a cursor in a section the moved one jumped over on the same text", () => {
    const view = mount(D1, D1.indexOf("\nc\n") + 1);

    applySectionMove(view, 1, 4);

    expect(around(view)).toEqual({ line: "c", above: "## Three" });
  });

  it("leaves a cursor before the moved span where it was", () => {
    const view = mount("intro\n\n# X\nx\n# Y\ny\n", 2);

    applySectionMove(view, 1, 0);

    expect(view.state.selection.main.head).toBe(2);
    expect(view.state.doc.toString()).toBe("intro\n\n# Y\ny\n# X\nx\n");
  });

  it("moves every selection range, keeping the main one", () => {
    const view = mount(D1);
    view.dispatch({
      selection: EditorSelection.create(
        [EditorSelection.cursor(D1.indexOf("\na\n") + 1), EditorSelection.cursor(D1.indexOf("\nc\n") + 1)],
        1,
      ),
    });

    applySectionMove(view, 1, 4);

    // Ranges stay sorted by position, so the cursor now sitting earlier in the text comes first.
    const heads = view.state.selection.ranges.map((range) => view.state.doc.lineAt(range.head).text);
    expect(heads).toEqual(["c", "a"]);
    expect(view.state.doc.lineAt(view.state.selection.main.head).text).toBe("c");
  });
});
