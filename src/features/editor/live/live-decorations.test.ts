import { markdown } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorSelection, EditorState } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { buildLiveDecorations } from "./live-decorations";

function stateFor(doc: string, selection?: EditorSelection) {
  const state = EditorState.create({ doc, selection, extensions: [markdown(), EditorState.allowMultipleSelections.of(true)] });
  ensureSyntaxTree(state, state.doc.length, 5000);
  return state;
}

interface Found {
  kind: "line" | "mark" | "hidden";
  from: number;
  to: number;
  class?: string;
}

function collect(set: DecorationSet, length: number): Found[] {
  const found: Found[] = [];
  set.between(0, length, (from, to, value) => {
    const cls = value.spec.class as string | undefined;
    if (cls && from === to) found.push({ kind: "line", from, to, class: cls });
    else if (cls) found.push({ kind: "mark", from, to, class: cls });
    else found.push({ kind: "hidden", from, to });
  });
  return found;
}

function build(doc: string, anchor?: number, head?: number) {
  const selection = anchor === undefined ? undefined : EditorSelection.single(anchor, head ?? anchor);
  const state = stateFor(doc, selection);
  return collect(buildLiveDecorations(state, [{ from: 0, to: state.doc.length }]), state.doc.length);
}

const lineClasses = (found: Found[]) => found.filter((f) => f.kind === "line").map((f) => f.class);
const hiddenFroms = (found: Found[]) => found.filter((f) => f.kind === "hidden").map((f) => f.from);

describe("headings", () => {
  it("styles the line by level and hides the marker on a line the cursor is not on", () => {
    const found = build("# Title\n\nbody", 12);
    expect(found).toContainEqual({ kind: "line", from: 0, to: 0, class: "cm-live-h1" });
    expect(found).toContainEqual({ kind: "hidden", from: 0, to: 2 });
  });

  it("uses the heading level in the class", () => {
    expect(lineClasses(build("### Third\n\nx", 11))).toContain("cm-live-h3");
  });

  it("shows raw markdown on the line the cursor is on, but keeps the line styled", () => {
    const found = build("# Title\n\nbody", 3);
    expect(hiddenFroms(found)).toEqual([]);
    expect(lineClasses(found)).toContain("cm-live-h1");
  });
});

describe("reveal rule", () => {
  const doc = "# One\n\n## Two\n\n### Three";

  it("reveals every line a multi-line selection touches and renders the rest", () => {
    const found = build(doc, 3, 10);
    expect(found.filter((f) => f.kind === "hidden")).toEqual([{ kind: "hidden", from: 15, to: 19 }]);
  });

  it("reveals the line for a caret at the very end of the line", () => {
    expect(hiddenFroms(build(doc, 5))).toEqual([7, 15]);
  });

  it("reveals nothing extra for several cursors on separate lines", () => {
    const state = stateFor(doc, EditorSelection.create([EditorSelection.cursor(2), EditorSelection.cursor(20)]));
    const found = collect(buildLiveDecorations(state, [{ from: 0, to: doc.length }]), doc.length);
    expect(hiddenFroms(found)).toEqual([7]);
  });
});

describe("blockquotes", () => {
  const doc = "> quoted\n> more\n\nafter";

  it("styles each quoted line and hides the markers away from the cursor", () => {
    const found = build(doc, 20);
    expect(found.filter((f) => f.class === "cm-live-quote").map((f) => f.from)).toEqual([0, 9]);
    expect(found.filter((f) => f.kind === "hidden")).toEqual([
      { kind: "hidden", from: 0, to: 2 },
      { kind: "hidden", from: 9, to: 11 },
    ]);
  });

  it("reveals only the quoted line the cursor is on", () => {
    expect(hiddenFroms(build(doc, 4))).toEqual([9]);
  });
});

describe("horizontal rules", () => {
  it("styles the line and makes the dashes invisible away from the cursor", () => {
    const found = build("a\n\n---\n\nb", 8);
    expect(found).toContainEqual({ kind: "line", from: 3, to: 3, class: "cm-live-hr" });
    expect(found).toContainEqual({ kind: "mark", from: 3, to: 6, class: "cm-live-hr-text" });
  });

  it("shows the raw dashes when the cursor is on the rule", () => {
    const found = build("a\n\n---\n\nb", 4);
    expect(found.filter((f) => f.kind === "mark")).toEqual([]);
  });
});

describe("lists", () => {
  it("renders bullet markers as bullets away from the cursor", () => {
    const found = build("- one\n- two", 8);
    expect(found).toContainEqual({ kind: "mark", from: 0, to: 1, class: "cm-live-bullet" });
    expect(found.filter((f) => f.class === "cm-live-bullet")).toHaveLength(1);
  });

  it("keeps numbered markers visible but styled", () => {
    const found = build("1. one\n2. two\n\nx", 15);
    expect(found).toContainEqual({ kind: "mark", from: 0, to: 2, class: "cm-live-number" });
    expect(found).toContainEqual({ kind: "mark", from: 7, to: 9, class: "cm-live-number" });
  });

  it("styles each item line for a hanging indent, revealed or not", () => {
    const found = build("- one\n- two", 2);
    expect(found.filter((f) => f.class === "cm-live-li").map((f) => f.from)).toEqual([0, 6]);
  });
});

describe("fenced code blocks", () => {
  const doc = "```js\nconst a = 1;\n```\n\ntext";

  it("styles every line and collapses the fence lines away from the cursor", () => {
    const found = build(doc, 25);
    const lines = found.filter((f) => f.kind === "line");
    expect(lines.map((f) => f.from)).toEqual([0, 6, 19]);
    expect(lines[0].class).toBe("cm-live-code cm-live-code-start cm-live-fence");
    expect(lines[1].class).toBe("cm-live-code");
    expect(lines[2].class).toBe("cm-live-code cm-live-code-end cm-live-fence");
  });

  it("shows the fence when the cursor is on that line", () => {
    const found = build(doc, 2);
    expect(found.filter((f) => f.kind === "line")[0].class).toBe("cm-live-code cm-live-code-start");
  });

  it("does not parse markdown inside the block", () => {
    const found = build("```\n# not a heading\n- not a list\n> not a quote\n```\n\nx", 50);
    expect(lineClasses(found).join(" ")).not.toMatch(/cm-live-(h1|li|quote)/);
    expect(found.filter((f) => f.kind !== "line")).toEqual([]);
  });
});

describe("visible ranges", () => {
  it("only decorates the ranges it is given", () => {
    const doc = "# A\n\n# B\n\n# C";
    const state = stateFor(doc, EditorSelection.single(doc.length));
    const set = buildLiveDecorations(state, [{ from: 5, to: 8 }]);
    expect(collect(set, doc.length).filter((f) => f.kind === "line").map((f) => f.from)).toEqual([5]);
  });
});
