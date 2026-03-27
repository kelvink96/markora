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
  it("renders a labeled editor region with a stable editing surface hook", () => {
    render(<EditorPane theme="light" />);

    expect(screen.getByRole("region", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
    expect(screen.getByTestId("editor-surface")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor" })).toHaveClass(
      "h-full",
      "py-4",
      "pl-4",
      "pr-0",
    );
    expect(screen.getByTestId("editor-surface")).toHaveClass(
      "flex-1",
      "min-h-0",
      "overflow-hidden",
    );
  });
});
