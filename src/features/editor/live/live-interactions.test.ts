import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { history, undo } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { liveExtension } from "./live-extension";

const views: EditorView[] = [];

function mount(doc: string, anchor: number, onOpenLink = vi.fn()) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: { anchor },
      extensions: [markdown({ base: markdownLanguage }), history(), liveExtension({ onOpenLink })],
    }),
  });
  views.push(view);
  return { view, onOpenLink };
}

afterEach(() => {
  while (views.length) {
    const view = views.pop()!;
    view.dom.parentElement?.remove();
    view.destroy();
  }
});

const AWAY = "\n\nplain"; // the caret goes on this line so the first lines render
const checkboxes = (view: EditorView) =>
  Array.from(view.dom.querySelectorAll<HTMLInputElement>("input.cm-live-checkbox"));

describe("task checkboxes", () => {
  it("renders a real checkbox that reflects [ ] and [x], keeping the marker text in the document", () => {
    const doc = `- [ ] todo\n- [x] done${AWAY}`;
    const { view } = mount(doc, doc.length);
    const boxes = checkboxes(view);
    expect(boxes.map((box) => box.checked)).toEqual([false, true]);
    // The real text is still in the DOM for screen readers and copy.
    expect(view.dom.querySelectorAll(".cm-line")[0].textContent).toContain("[ ] todo");
    expect(boxes[0].getAttribute("aria-label")).toBeTruthy();
  });

  it("shows no checkbox on the line the caret is on, so the raw markdown can be edited", () => {
    const { view } = mount("- [ ] todo", 5);
    expect(checkboxes(view)).toHaveLength(0);
  });

  it("toggles the marker with a normal edit, and undo reverses it", () => {
    const doc = `- [ ] todo${AWAY}`;
    const { view } = mount(doc, doc.length);
    checkboxes(view)[0].click();
    expect(view.state.doc.toString()).toBe(`- [x] todo${AWAY}`);
    expect(checkboxes(view)[0].checked).toBe(true);
    undo(view);
    expect(view.state.doc.toString()).toBe(doc);
    expect(checkboxes(view)[0].checked).toBe(false);
  });

  it("is its own undo step, even when typing follows straight after", () => {
    const doc = `- [ ] todo${AWAY}`;
    const { view } = mount(doc, doc.length);
    checkboxes(view)[0].click();
    view.dispatch({ changes: { from: 4, insert: "y" }, userEvent: "input.type" });
    expect(view.state.doc.toString()).toBe(`- [xy] todo${AWAY}`);

    undo(view);

    expect(view.state.doc.toString()).toBe(`- [x] todo${AWAY}`);
  });

  it("puts the box back in line with the document when the toggle cannot be applied", () => {
    const doc = `- [ ] todo${AWAY}`;
    const { view } = mount(doc, doc.length);
    const box = checkboxes(view)[0];
    vi.spyOn(view, "posAtDOM").mockReturnValue(0);

    box.click();

    expect(view.state.doc.toString()).toBe(doc);
    expect(box.checked).toBe(false);
  });

  it("unchecks a checked item and works in a nested list", () => {
    const doc = `- parent\n  - [x] child\n    - [ ] grandchild${AWAY}`;
    const { view } = mount(doc, doc.length);
    const boxes = checkboxes(view);
    expect(boxes).toHaveLength(2);
    boxes[0].click();
    expect(view.state.doc.toString()).toBe(`- parent\n  - [ ] child\n    - [ ] grandchild${AWAY}`);
    checkboxes(view)[1].click();
    expect(view.state.doc.toString()).toBe(`- parent\n  - [ ] child\n    - [x] grandchild${AWAY}`);
  });

  it("is keyboard accessible: focusable, and Enter toggles it (Space is the native checkbox toggle)", () => {
    const doc = `- [ ] todo${AWAY}`;
    const { view } = mount(doc, doc.length);
    const box = checkboxes(view)[0];
    expect(box.tabIndex).toBeGreaterThanOrEqual(0);
    box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(view.state.doc.toString()).toBe(`- [x] todo${AWAY}`);
  });

  it("does not move the caret when clicked", () => {
    const doc = `- [ ] todo${AWAY}`;
    const { view } = mount(doc, doc.length);
    checkboxes(view)[0].click();
    expect(view.state.selection.main.head).toBe(doc.length);
  });
});

function pointer(target: Element, type: "mousedown" | "click", init: MouseEventInit = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
}

function click(target: Element, init: MouseEventInit = {}) {
  pointer(target, "mousedown", init);
  return pointer(target, "click", init);
}

describe("links that span lines", () => {
  it.each([
    ["destination on the next line", "[a](\n  http://x) tail"],
    ["title wrapped onto the next line", '[a](http://x "one\ntwo") tail'],
  ])("mounts without throwing when the %s", (_name, text) => {
    expect(() => mount(`${text}${AWAY}`, text.length + 2)).not.toThrow();
  });
});

describe("link destinations", () => {
  function opened(link: string) {
    const doc = `${link}${AWAY}`;
    const { view, onOpenLink } = mount(doc, doc.length);
    click(view.dom.querySelector(".cm-live-link")!, { ctrlKey: true });
    return onOpenLink.mock.calls.map(([href]) => href);
  }

  it("drops the angle brackets around a destination with spaces", () => {
    expect(opened("[a](<https://x.dev/a b>)")).toEqual(["https://x.dev/a b"]);
  });

  it("decodes entities and backslash escapes", () => {
    expect(opened("[a](https://x.dev/?a=1&amp;b=2)")).toEqual(["https://x.dev/?a=1&b=2"]);
    expect(opened("[a](https://x.dev/\\_a\\_)")).toEqual(["https://x.dev/_a_"]);
    expect(opened("[a](https://x.dev/&#65;&#x42;)")).toEqual(["https://x.dev/AB"]);
  });
});

describe("link clicks", () => {
  const doc = `see [docs](https://example.com/a) and <https://auto.dev>${AWAY}`;
  const links = (view: EditorView) => Array.from(view.dom.querySelectorAll(".cm-live-link"));

  it("opens a rendered link on Ctrl+click and on Cmd+click", () => {
    const { view, onOpenLink } = mount(doc, doc.length);
    click(links(view)[0], { ctrlKey: true });
    click(links(view)[0], { metaKey: true });
    expect(onOpenLink.mock.calls).toEqual([["https://example.com/a"], ["https://example.com/a"]]);
  });

  it("opens an autolink on Ctrl+click", () => {
    const { view, onOpenLink } = mount(doc, doc.length);
    click(links(view)[1], { ctrlKey: true });
    expect(onOpenLink).toHaveBeenCalledWith("https://auto.dev");
  });

  it("does nothing on a plain click, leaving the caret placement to the editor", () => {
    const { view, onOpenLink } = mount(doc, doc.length);
    const link = links(view)[0];
    const down = pointer(link, "mousedown");
    pointer(link, "click");
    expect(onOpenLink).not.toHaveBeenCalled();
    // CodeMirror handles the press itself (placing the caret), so the link line is now revealed.
    expect(down.defaultPrevented).toBe(true);
    expect(view.dom.querySelectorAll(".cm-live-link")).toHaveLength(0);
  });

  it("leaves the selection alone on Ctrl+click, so it neither adds a caret nor reveals the line", () => {
    const { view } = mount(doc, doc.length);
    pointer(links(view)[0], "mousedown", { ctrlKey: true });
    expect(view.state.selection.ranges).toHaveLength(1);
    expect(view.state.selection.main.head).toBe(doc.length);
    expect(links(view)).toHaveLength(2);
  });

  it("ignores Ctrl+click on text that is not a link", () => {
    const { view, onOpenLink } = mount(doc, doc.length);
    click(view.dom.querySelector(".cm-line")!, { ctrlKey: true });
    expect(onOpenLink).not.toHaveBeenCalled();
  });
});
