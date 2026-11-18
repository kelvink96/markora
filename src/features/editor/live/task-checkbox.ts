import { type EditorView, WidgetType } from "@codemirror/view";

/**
 * A real `<input type="checkbox">` drawn in front of a task marker. The `[ ]` / `[x]` text stays in
 * the document (the handler only hides it visually), so screen readers and copy still see it; the
 * checkbox adds a native control on top, with its own checked state and keyboard handling.
 * Toggling is an ordinary editor transaction, so it is undoable and marks the document dirty.
 */
export class TaskCheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }

  eq(other: TaskCheckboxWidget) {
    return other.checked === this.checked;
  }

  toDOM(view: EditorView) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "cm-live-checkbox";
    box.setAttribute("aria-label", "Task");
    box.checked = this.checked;
    // Keep the editor from moving the caret (and revealing the line) when the box is pressed.
    box.addEventListener("mousedown", (event) => event.preventDefault());
    // The native toggle already flipped the box; the edit makes the document agree, and the
    // widget then redraws from the document.
    box.addEventListener("click", () => toggleTask(view, box));
    box.addEventListener("keydown", (event) => {
      // Space toggles a native checkbox already (as a click); Enter is added for list-style use.
      if (event.key !== "Enter") return;
      event.preventDefault();
      toggleTask(view, box);
    });
    return box;
  }

  updateDOM(dom: HTMLElement) {
    // Update in place so keyboard focus stays on the box after it toggles.
    (dom as HTMLInputElement).checked = this.checked;
    return true;
  }

  ignoreEvent() {
    return true;
  }
}

function toggleTask(view: EditorView, box: HTMLElement) {
  const from = view.posAtDOM(box);
  const marker = view.state.sliceDoc(from, from + 3);
  if (!/^\[[ xX]\]$/.test(marker)) return;
  view.dispatch({
    changes: { from: from + 1, to: from + 2, insert: marker[1] === " " ? "x" : " " },
    userEvent: "input.toggle",
  });
}
