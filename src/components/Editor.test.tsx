import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Editor } from "./Editor";

// CodeMirror depends on DOM APIs that jsdom does not fully emulate, so we replace
// the editor classes with lightweight test doubles.
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

describe("Editor", () => {
  it("renders the editor container", () => {
    const { container } = render(<Editor theme="light" />);
    expect(container.querySelector(".editor-container")).toBeTruthy();
  });
});
