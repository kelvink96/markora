import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorPane } from "./editor-pane";

// CodeMirror depends on browser APIs jsdom does not fully provide, so we stub the editor surface.
vi.mock("codemirror", () => ({
  EditorView: class {
    constructor() {}
    destroy() {}
    get state() {
      return { doc: { toString: () => "" } };
    }
    dispatch() {}
  },
  basicSetup: [],
}));

vi.mock("@codemirror/state", () => ({
  EditorState: { create: vi.fn(() => ({})) },
}));

vi.mock("@codemirror/view", () => ({
  EditorView: {
    updateListener: { of: vi.fn(() => ({})) },
    lineWrapping: {},
  },
}));

vi.mock("@codemirror/lang-markdown", () => ({ markdown: vi.fn(() => ({})) }));
vi.mock("@codemirror/theme-one-dark", () => ({ oneDark: {} }));

describe("EditorPane", () => {
  it("renders the editor container", () => {
    const { container } = render(<EditorPane theme="light" />);
    expect(container.querySelector(".editor-pane")).toBeTruthy();
  });

  it("renders a local editor toolbar above the editing surface", () => {
    const { container } = render(<EditorPane theme="light" />);

    expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
    expect(container.querySelector(".editor-pane__header")).toBeTruthy();
    expect(container.querySelector(".editor-pane__surface")).toBeTruthy();
  });
});
