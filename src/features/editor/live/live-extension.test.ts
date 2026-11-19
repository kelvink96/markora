import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { liveExtension } from "./live-extension";

const views: EditorView[] = [];

function mount(doc: string, extensions = [markdown(), liveExtension()], anchor = doc.length) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({ doc, selection: { anchor }, extensions }),
  });
  views.push(view);
  return view;
}

const lineText = (view: EditorView, index: number) =>
  view.dom.querySelectorAll(".cm-line")[index]?.textContent;

afterEach(() => {
  while (views.length) {
    const view = views.pop()!;
    view.dom.parentElement?.remove();
    view.destroy();
  }
});

describe("liveExtension", () => {
  it("renders a heading line and flips it to raw markdown when the caret enters, and back when it leaves", () => {
    const view = mount("# Title\n\nbody");
    expect(lineText(view, 0)).toBe("Title");
    expect(view.dom.querySelector(".cm-line")?.classList.contains("cm-live-h1")).toBe(true);

    view.dispatch({ selection: { anchor: 3 } });
    expect(lineText(view, 0)).toBe("# Title");

    view.dispatch({ selection: { anchor: view.state.doc.length } });
    expect(lineText(view, 0)).toBe("Title");
  });

  it("never changes the document", () => {
    const doc = "# Title\n\n- a\n\n```js\nx\n```";
    const view = mount(doc, [markdown(), liveExtension()], 0);
    view.dispatch({ selection: { anchor: doc.length } });
    expect(view.state.doc.toString()).toBe(doc);
  });

  it("re-renders when the text changes", () => {
    const view = mount("plain\n\nbody");
    expect(lineText(view, 0)).toBe("plain");
    view.dispatch({ changes: { from: 0, insert: "# " }, selection: { anchor: view.state.doc.length } });
    expect(lineText(view, 0)).toBe("plain");
    expect(view.dom.querySelector(".cm-line")?.classList.contains("cm-live-h1")).toBe(true);
  });

  it("is inert without the extension", () => {
    const view = mount("# Title\n\nbody", [markdown()]);
    expect(lineText(view, 0)).toBe("# Title");
  });
});
