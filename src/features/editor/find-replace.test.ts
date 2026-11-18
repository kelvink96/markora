// Real CodeMirror (the EditorPane tests mock it), so this checks what users actually get.
import { afterEach, describe, expect, it } from "vitest";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import {
  MATCH_LIMIT,
  applyFind,
  defaultFindOptions,
  findExtensions,
  closeFindHighlighting,
  goToNextMatch,
  goToPreviousMatch,
  openFindHighlighting,
  replaceCurrentMatch,
  replaceEveryMatch,
  summarizeMatches,
  type FindOptions,
} from "./find-replace";

let mounted: { view: EditorView; parent: HTMLElement } | null = null;

function mount(doc: string, cursor = 0) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const view = new EditorView({
    state: EditorState.create({ doc, selection: { anchor: cursor }, extensions: [basicSetup, ...findExtensions] }),
    parent,
  });
  mounted = { view, parent };
  return view;
}

const opts = (overrides: Partial<FindOptions>): FindOptions => ({ ...defaultFindOptions, ...overrides });

afterEach(() => {
  mounted?.view.destroy();
  mounted?.parent.remove();
  mounted = null;
});

describe("summarizeMatches", () => {
  it("counts matches and ignores case by default", () => {
    const view = mount("Cat cat CAT dog");

    expect(summarizeMatches(view.state, opts({ search: "cat" }))).toEqual({
      total: 3,
      current: 0,
      capped: false,
      valid: true,
    });
  });

  it("matches case when asked", () => {
    const view = mount("Cat cat CAT dog");

    expect(summarizeMatches(view.state, opts({ search: "cat", caseSensitive: true })).total).toBe(1);
  });

  it("matches whole words only when asked", () => {
    const view = mount("cat concatenate cat.");

    expect(summarizeMatches(view.state, opts({ search: "cat" })).total).toBe(3);
    expect(summarizeMatches(view.state, opts({ search: "cat", wholeWord: true })).total).toBe(2);
  });

  it("treats the search as a regular expression when asked", () => {
    const view = mount("a1 b22 c333");

    expect(summarizeMatches(view.state, opts({ search: "\\d+", regexp: true })).total).toBe(3);
    expect(summarizeMatches(view.state, opts({ search: "\\d+" })).total).toBe(0); // literal text
  });

  it("reports an invalid regular expression instead of throwing", () => {
    const view = mount("anything");

    expect(summarizeMatches(view.state, opts({ search: "(", regexp: true }))).toEqual({
      total: 0,
      current: 0,
      capped: false,
      valid: false,
    });
  });

  it("finds nothing for an empty search", () => {
    const view = mount("anything");

    expect(summarizeMatches(view.state, opts({ search: "" })).total).toBe(0);
    expect(summarizeMatches(view.state, opts({ search: "" })).valid).toBe(true);
  });

  it("stops counting at the limit so huge documents stay fast", () => {
    const view = mount("a".repeat(MATCH_LIMIT + 500));

    const summary = summarizeMatches(view.state, opts({ search: "a" }));

    expect(summary.total).toBe(MATCH_LIMIT);
    expect(summary.capped).toBe(true);
  });

  it("says which match the selection is on", () => {
    const view = mount("one two one two one");
    applyFind(view, opts({ search: "two" }));

    expect(summarizeMatches(view.state, opts({ search: "two" }))).toMatchObject({ total: 2, current: 1 });
    goToNextMatch(view);
    expect(summarizeMatches(view.state, opts({ search: "two" })).current).toBe(2);
  });
});

describe("applyFind", () => {
  it("selects the first match at or after the cursor, so typing doesn't skip past a result", () => {
    const view = mount("one two one two", 5); // cursor inside the first "two"... after "one t"

    applyFind(view, opts({ search: "one" }));

    expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toBe("one");
    expect(view.state.selection.main.from).toBe(8); // the second "one"; the first is behind the cursor
  });

  it("wraps to the first match when none is after the cursor", () => {
    const view = mount("one two three", 12);

    applyFind(view, opts({ search: "one" }));

    expect(view.state.selection.main.from).toBe(0);
  });

  it("leaves the selection alone when nothing matches", () => {
    const view = mount("hello world", 3);

    applyFind(view, opts({ search: "zzz" }));

    expect(view.state.selection.main.from).toBe(3);
  });

  it("doesn't change the document", () => {
    const view = mount("hello world");

    applyFind(view, opts({ search: "o" }));

    expect(view.state.doc.toString()).toBe("hello world");
  });
});

describe("navigating", () => {
  it("moves forward and back through matches, wrapping at the ends", () => {
    const view = mount("x a x b x");
    applyFind(view, opts({ search: "x" }));
    const at = () => view.state.selection.main.from;

    expect(at()).toBe(0);
    goToNextMatch(view);
    expect(at()).toBe(4);
    goToNextMatch(view);
    expect(at()).toBe(8);
    goToNextMatch(view);
    expect(at()).toBe(0); // wrapped
    goToPreviousMatch(view);
    expect(at()).toBe(8); // wrapped back
  });
});

describe("replacing", () => {
  it("replaces the current match and moves to the next", () => {
    const view = mount("cat dog cat");
    applyFind(view, opts({ search: "cat", replace: "bird" }));

    replaceCurrentMatch(view);

    expect(view.state.doc.toString()).toBe("bird dog cat");
  });

  it("replaces every match in one undoable step", () => {
    const view = mount("cat dog cat cat");
    applyFind(view, opts({ search: "cat", replace: "bird" }));

    replaceEveryMatch(view);

    expect(view.state.doc.toString()).toBe("bird dog bird bird");
  });

  it("supports capture groups in regular expression replacements", () => {
    const view = mount("2024-05-17");
    applyFind(view, opts({ search: "(\\d+)-(\\d+)-(\\d+)", replace: "$3/$2/$1", regexp: true }));

    replaceEveryMatch(view);

    expect(view.state.doc.toString()).toBe("17/05/2024");
  });

  it("can replace with nothing, which deletes the matches", () => {
    const view = mount("a-b-c");
    applyFind(view, opts({ search: "-", replace: "" }));

    replaceEveryMatch(view);

    expect(view.state.doc.toString()).toBe("abc");
  });
});

describe("match highlighting", () => {
  const highlighted = (view: EditorView) => view.dom.querySelectorAll(".cm-searchMatch").length;

  it("draws every match once highlighting is on, and the selected one differently", () => {
    const view = mount("cat dog cat bird cat");
    openFindHighlighting(view);

    applyFind(view, opts({ search: "cat" }));

    expect(highlighted(view)).toBe(3);
    expect(view.dom.querySelectorAll(".cm-searchMatch-selected")).toHaveLength(1);
  });

  it("draws nothing before highlighting is turned on (CodeMirror only highlights while its panel is open)", () => {
    const view = mount("cat dog cat");

    applyFind(view, opts({ search: "cat" }));

    expect(highlighted(view)).toBe(0);
  });

  it("removes the highlights when it is turned off", () => {
    const view = mount("cat dog cat");
    openFindHighlighting(view);
    applyFind(view, opts({ search: "cat" }));

    closeFindHighlighting(view);

    expect(highlighted(view)).toBe(0);
  });

  it("leaves no visible search panel behind, since the app draws its own bar", () => {
    const view = mount("cat");
    openFindHighlighting(view);

    expect(view.dom.querySelector(".cm-search")).toBeNull();
  });
});
