type MockUpdate = {
  docChanged?: boolean;
  selectionSet?: boolean;
  focusChanged?: boolean;
  state: {
    doc: {
      toString: () => string;
      lineAt: (cursor: number) => { number: number; from: number };
    };
    selection: {
      main: {
        head: number;
        from: number;
        to: number;
      };
    };
  };
};

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useSettingsStore } from "../../../features/settings/settings-store";

const { mockState } = vi.hoisted(() => {
  class HoistedMockEditorView {
    state: MockUpdate["state"];

    constructor({ state }: { state: MockUpdate["state"] }) {
      this.state = state;
    }

    destroy() {}

    dispatch(transaction: unknown) {
      mockState.dispatchSpy(transaction);
    }

    focus() {}

    coordsAtPos() {
      return { left: 32, bottom: 40 };
    }
  }

  return {
    mockState: {
      updateListener: null as ((update: MockUpdate) => void) | null,
      EditorView: HoistedMockEditorView,
      dispatchSpy: vi.fn(),
    },
  };
});

vi.mock("codemirror", () => ({
  EditorView: mockState.EditorView,
  basicSetup: [],
}));

vi.mock("@codemirror/state", () => ({
  EditorState: {
    create: vi.fn(({ doc }: { doc: string }) => ({
      doc: {
        toString: () => doc,
        length: doc.length,
        lineAt: (_cursor: number) => ({
          number: 1,
          from: 0,
        }),
      },
      selection: {
        main: {
          head: doc.length,
          from: doc.length,
          to: doc.length,
        },
      },
    })),
  },
}));

vi.mock("@codemirror/view", () => ({
  EditorView: {
    theme: vi.fn((config: unknown) => config),
    updateListener: {
      of: vi.fn((listener: (update: MockUpdate) => void) => {
        mockState.updateListener = listener;
        return listener;
      }),
    },
    lineWrapping: {},
  },
}));

vi.mock("@codemirror/lang-markdown", () => ({ markdown: vi.fn(() => ({})) }));
vi.mock("@codemirror/theme-one-dark", () => ({ oneDark: {} }));
import { EditorPane } from "./editor-pane";

describe("EditorPane", () => {
  beforeEach(() => {
    const settings = createDefaultSettings();
    useSettingsStore.setState({
      isHydrated: true,
      settings,
      templateDraft: settings.authoring.newDocumentTemplate,
    });
  });

  it("marks the editor surface when line numbers are hidden", () => {
    const settings = createDefaultSettings();
    settings.editor.lineNumbers = false;
    useSettingsStore.setState({
      isHydrated: true,
      settings,
      templateDraft: settings.authoring.newDocumentTemplate,
    });

    render(<EditorPane theme="light" />);

    expect(screen.getByTestId("editor-surface")).toHaveAttribute("data-line-numbers", "hidden");
  });

  it("applies toolbar actions to the editor document through the command bridge", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      useEditorCommandState.getState().runToolbarAction("bold");
    });

    expect(mockState.dispatchSpy).toHaveBeenCalled();
    const lastCall = mockState.dispatchSpy.mock.calls[mockState.dispatchSpy.mock.calls.length - 1]?.[0];
    expect(lastCall).toMatchObject({
      changes: expect.objectContaining({
        insert: expect.stringContaining("**"),
      }),
    });
  });

  it("renders a labeled editor region with a stable editing surface hook", () => {
    render(<EditorPane theme="light" />);

    expect(screen.getByRole("region", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByTestId("editor-surface")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor" })).toHaveClass(
      "h-full",
      "min-h-0",
      "pb-0",
      "pr-0",
    );
    expect(screen.getByTestId("editor-surface").parentElement?.parentElement).toHaveClass(
      "bg-[color:var(--glass-panel)]",
      "backdrop-blur-[var(--glass-blur-soft)]",
    );
    expect(screen.getByTestId("editor-surface")).toHaveClass(
      "bg-[color:var(--glass-elevated)]",
      "border-[color:var(--glass-border-strong)]",
      "flex-1",
      "min-h-0",
      "overflow-hidden",
    );
  });

  it("shows the slash command menu when the cursor is inside a slash token", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        docChanged: true,
        selectionSet: true,
        state: {
          doc: {
            toString: () => "Hello /ta",
            lineAt: () => ({ number: 1, from: 0 }),
          },
          selection: {
            main: {
              head: 9,
              from: 9,
              to: 9,
            },
          },
        },
      });
    });

    expect(screen.getByRole("listbox", { name: "Slash commands" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /table/i })).toBeInTheDocument();
  });
});
