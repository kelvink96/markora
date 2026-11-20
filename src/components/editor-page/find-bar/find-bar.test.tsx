// Uses a real CodeMirror editor (the EditorPane tests mock it) so the bar is checked end to end.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { findExtensions } from "../../../features/editor/find-replace";
import { FindBar } from "./find-bar";

let editor: { view: EditorView; parent: HTMLElement } | null = null;

function mountEditor(doc: string) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const view = new EditorView({
    state: EditorState.create({ doc, extensions: [basicSetup, ...findExtensions] }),
    parent,
  });
  editor = { view, parent };
  return view;
}

function renderBar(doc: string, props: Partial<Parameters<typeof FindBar>[0]> = {}) {
  const view = mountEditor(doc);
  const onClose = vi.fn();
  const utils = render(<FindBar view={view} initialMode="find" version={0} onClose={onClose} {...props} />);
  return { view, onClose, ...utils };
}

const selected = (view: EditorView) => view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);

afterEach(() => {
  editor?.view.destroy();
  editor?.parent.remove();
  editor = null;
});

describe("FindBar", () => {
  it("is a labelled search region and focuses the find box", () => {
    renderBar("hello");

    expect(screen.getByRole("search", { name: "Find and replace" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Find" })).toHaveFocus();
  });

  // One field: the match count and the case / word / regex options sit inside the search box.
  it("builds the search box from InputGroup, with the count and options inside it", () => {
    renderBar("cat dog cat", { initialSearch: "cat" });

    const group = screen.getByRole("textbox", { name: "Find" }).closest("[data-slot=input-group]");
    expect(group).not.toBeNull();
    expect(group).toContainElement(screen.getByRole("status"));
    for (const name of ["Match case", "Match whole word", "Use regular expression"]) {
      expect(group).toContainElement(screen.getByRole("button", { name }));
    }
    // Previous and next stay outside, beside the field.
    expect(group).not.toContainElement(screen.getByRole("button", { name: "Next match" }));
  });

  it("fills the find box with the selected text and shows its matches", () => {
    renderBar("cat dog cat", { initialSearch: "cat" });

    expect(screen.getByRole("textbox", { name: "Find" })).toHaveValue("cat");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2");
  });

  it("counts matches as you type and selects the first one", async () => {
    const user = userEvent.setup();
    const { view } = renderBar("one two one two one");

    await user.type(screen.getByRole("textbox", { name: "Find" }), "one");

    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
    expect(selected(view)).toBe("one");
  });

  it("says when there are no results", async () => {
    const user = userEvent.setup();
    renderBar("hello world");

    await user.type(screen.getByRole("textbox", { name: "Find" }), "zzz");

    expect(screen.getByRole("status")).toHaveTextContent("No results");
    expect(screen.getByRole("button", { name: "Next match" })).toBeDisabled();
  });

  it("moves to the next match on Enter and the previous on Shift+Enter", async () => {
    const user = userEvent.setup();
    const { view } = renderBar("x a x b x");
    await user.type(screen.getByRole("textbox", { name: "Find" }), "x");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");

    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(view.state.selection.main.from).toBe(4);

    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
  });

  it("moves with the Next and Previous buttons too", async () => {
    const user = userEvent.setup();
    renderBar("x a x");
    await user.type(screen.getByRole("textbox", { name: "Find" }), "x");

    await user.click(screen.getByRole("button", { name: "Next match" }));
    expect(screen.getByRole("status")).toHaveTextContent("2 of 2");

    await user.click(screen.getByRole("button", { name: "Previous match" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2");
  });

  it("honours match case, whole word and regular expressions", async () => {
    const user = userEvent.setup();
    renderBar("Cat cat concat 7");
    const find = screen.getByRole("textbox", { name: "Find" });

    await user.type(find, "cat");
    expect(screen.getByRole("status")).toHaveTextContent(/of 3/);

    await user.click(screen.getByRole("button", { name: "Match case" }));
    expect(screen.getByRole("status")).toHaveTextContent(/of 2/);

    await user.click(screen.getByRole("button", { name: "Match whole word" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 of 1");

    await user.clear(find);
    await user.type(find, "\\d");
    await user.click(screen.getByRole("button", { name: "Use regular expression" }));
    await user.click(screen.getByRole("button", { name: "Match whole word" })); // off again
    expect(screen.getByRole("status")).toHaveTextContent("1 of 1");
  });

  it("flags an invalid regular expression instead of failing silently", async () => {
    const user = userEvent.setup();
    renderBar("anything");
    await user.click(screen.getByRole("button", { name: "Use regular expression" }));

    await user.type(screen.getByRole("textbox", { name: "Find" }), "(");

    // Short, because it shows inside the search field; the field's error state carries the rest.
    expect(screen.getByRole("status")).toHaveTextContent("Invalid regex");
    expect(screen.getByRole("textbox", { name: "Find" })).toHaveAttribute("aria-invalid", "true");
  });

  it("Ctrl+H inside the bar opens the replace row and focuses it, instead of the browser history page", async () => {
    const user = userEvent.setup();
    renderBar("cat");
    expect(screen.queryByRole("textbox", { name: "Replace" })).not.toBeInTheDocument();

    await user.keyboard("{Control>}h{/Control}");

    expect(screen.getByRole("textbox", { name: "Replace" })).toHaveFocus();
  });

  it("Ctrl+H again moves focus to the replace box when it is already open", async () => {
    const user = userEvent.setup();
    renderBar("cat", { initialMode: "replace" });
    screen.getByRole("textbox", { name: "Find" }).focus();

    await user.keyboard("{Control>}h{/Control}");

    expect(screen.getByRole("textbox", { name: "Replace" })).toHaveFocus();
  });

  it("Ctrl+F inside the bar returns focus to the find box and selects its text", async () => {
    const user = userEvent.setup();
    renderBar("cat", { initialSearch: "cat", initialMode: "replace" });
    screen.getByRole("textbox", { name: "Replace" }).focus();

    await user.keyboard("{Control>}f{/Control}");

    expect(screen.getByRole("textbox", { name: "Find" })).toHaveFocus();
  });

  it("closes on Escape and from the close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderBar("hello");

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Close find" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("highlights the matches in the editor while the bar is open and clears them when it closes", () => {
    const { view, unmount } = renderBar("cat dog cat", { initialSearch: "cat" });

    expect(view.dom.querySelectorAll(".cm-searchMatch")).toHaveLength(2);

    unmount();
    expect(view.dom.querySelectorAll(".cm-searchMatch")).toHaveLength(0);
  });

  it("keeps focus in the bar after Replace all, so Escape still closes it", async () => {
    const user = userEvent.setup();
    const { onClose } = renderBar("cat cat", { initialMode: "replace", initialSearch: "cat" });

    await user.type(screen.getByRole("textbox", { name: "Replace" }), "x");
    await user.click(screen.getByRole("button", { name: "All" })); // nothing is left to replace, so it disables itself

    expect(screen.getByRole("search").contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("recounts when the document changes underneath it", async () => {
    const user = userEvent.setup();
    const { view, rerender, onClose } = renderBar("cat", { initialSearch: "cat" });
    expect(screen.getByRole("status")).toHaveTextContent("1 of 1");

    act(() => {
      view.dispatch({ changes: { from: 3, insert: " cat cat" } });
    });
    rerender(<FindBar view={view} initialMode="find" version={1} onClose={onClose} />);

    expect(screen.getByRole("status")).toHaveTextContent(/of 3/);
    await user.keyboard("{Escape}");
  });

  describe("replace", () => {
    it("starts collapsed for Find and open for Replace", () => {
      const { unmount } = renderBar("a");
      expect(screen.queryByRole("textbox", { name: "Replace" })).not.toBeInTheDocument();
      unmount();

      renderBar("a", { initialMode: "replace" });
      expect(screen.getByRole("textbox", { name: "Replace" })).toBeInTheDocument();
    });

    it("expands from the chevron", async () => {
      const user = userEvent.setup();
      renderBar("a");

      await user.click(screen.getByRole("button", { name: "Show replace" }));

      expect(screen.getByRole("textbox", { name: "Replace" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hide replace" })).toHaveAttribute("aria-expanded", "true");
    });

    it("replaces one match at a time", async () => {
      const user = userEvent.setup();
      const { view } = renderBar("cat dog cat", { initialMode: "replace", initialSearch: "cat" });

      await user.type(screen.getByRole("textbox", { name: "Replace" }), "bird");
      await user.click(screen.getByRole("button", { name: "Replace" }));

      expect(view.state.doc.toString()).toBe("bird dog cat");
      expect(screen.getByRole("status")).toHaveTextContent(/1 (of 1|match)/);
    });

    it("replaces one on Enter in the replace box", async () => {
      const user = userEvent.setup();
      const { view } = renderBar("cat dog cat", { initialMode: "replace", initialSearch: "cat" });

      await user.type(screen.getByRole("textbox", { name: "Replace" }), "bird{Enter}");

      expect(view.state.doc.toString()).toBe("bird dog cat");
    });

    it("replaces all matches at once", async () => {
      const user = userEvent.setup();
      const { view } = renderBar("cat dog cat", { initialMode: "replace", initialSearch: "cat" });

      await user.type(screen.getByRole("textbox", { name: "Replace" }), "bird");
      await user.click(screen.getByRole("button", { name: "All" }));

      expect(view.state.doc.toString()).toBe("bird dog bird");
      expect(screen.getByRole("status")).toHaveTextContent("No results");
    });

    it("disables the replace buttons when there is nothing to replace", () => {
      renderBar("hello", { initialMode: "replace", initialSearch: "zzz" });

      expect(screen.getByRole("button", { name: "Replace" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "All" })).toBeDisabled();
    });
  });
});
