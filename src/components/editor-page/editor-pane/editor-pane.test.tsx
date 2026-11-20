type MockUpdate = {
  docChanged?: boolean;
  selectionSet?: boolean;
  focusChanged?: boolean;
  view?: {
    hasFocus: boolean;
  };
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
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { createDefaultSettings } from "../../../features/settings/settings-schema";
import { useDocumentStore } from "../../../store/document";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { EditorState } from "@codemirror/state";

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
      keybindings: [] as Array<{ key: string; run: () => boolean }>,
    },
  };
});

const { clipboardReadTextMock, clipboardWriteTextMock } = vi.hoisted(() => ({
  clipboardReadTextMock: vi.fn(),
  clipboardWriteTextMock: vi.fn(),
}));

vi.mock("codemirror", () => ({
  EditorView: mockState.EditorView,
  basicSetup: [],
}));

vi.mock("@codemirror/state", () => ({
  Prec: { highest: (extension: unknown) => extension },
  Compartment: class {
    of(extension: unknown) {
      return extension;
    }

    reconfigure(extension: unknown) {
      return { reconfigured: extension };
    }
  },
  EditorState: {
    create: vi.fn(({ doc }: { doc: string }) => ({
      doc: {
        toString: () => doc,
        length: doc.length,
        lineAt: (_cursor: number) => ({
          number: 1,
          from: 0,
        }),
        // A 20-line document where line n starts at (n - 1) * 10.
        lines: 20,
        line: (n: number) => ({ number: n, from: (n - 1) * 10 }),
      },
      selection: {
        main: {
          head: doc.length,
          from: 0,
          to: doc.length,
        },
      },
    })),
  },
}));

vi.mock("@codemirror/view", () => ({
  keymap: {
    of: vi.fn((bindings: unknown[]) => {
      mockState.keybindings = bindings as typeof mockState.keybindings;
      return bindings;
    }),
  },
  EditorView: {
    theme: vi.fn((config: unknown) => config),
    updateListener: {
      of: vi.fn((listener: (update: MockUpdate) => void) => {
        mockState.updateListener = listener;
        return listener;
      }),
    },
    lineWrapping: {},
    scrollIntoView: vi.fn((position: number, options: unknown) => ({ scrollIntoView: { position, options } })),
    darkTheme: { of: vi.fn((isDark: boolean) => ({ dark: isDark })) },
  },
}));

vi.mock("@codemirror/lang-markdown", () => ({ markdown: vi.fn(() => ({})), markdownLanguage: {} }));
// The real theme is exercised in editor-settings-extensions.test.ts and in the browser.
vi.mock("../../../features/editor/editor-theme", () => ({ markoraEditorTheme: [] }));
// The real Live extension is exercised in features/editor/live/*.test.ts.
vi.mock("../../../features/editor/live/live-extension", () => ({
  liveExtension: vi.fn(() => "live-extension"),
}));
// The real dimming extension is exercised in features/editor/focus/*.test.ts.
vi.mock("../../../features/editor/focus/focus-dimming", () => ({
  focusDimming: vi.fn(() => "focus-dimming"),
}));
// The real move is exercised against a real editor in features/outline/apply-section-move.test.ts.
vi.mock("../../../features/outline/apply-section-move", () => ({
  applySectionMove: vi.fn(() => true),
}));
vi.mock("@codemirror/commands", () => ({
  undo: vi.fn((view: { dispatch: (transaction: unknown) => void }) => {
    view.dispatch({ annotation: "undo" });
    return true;
  }),
  redo: vi.fn((view: { dispatch: (transaction: unknown) => void }) => {
    view.dispatch({ annotation: "redo" });
    return true;
  }),
  selectAll: vi.fn((view: { dispatch: (transaction: unknown) => void }) => {
    view.dispatch({ selection: "all" });
    return true;
  }),
}));
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  readText: clipboardReadTextMock,
  writeText: clipboardWriteTextMock,
}));
vi.mock("../../../features/editor/find-replace", () => ({ findExtensions: [] }));
vi.mock("../find-bar", () => ({
  FindBar: ({ initialMode, initialSearch, onClose }: { initialMode: string; initialSearch: string; onClose: () => void }) => (
    <div role="search" data-mode={initialMode} data-search={initialSearch}>
      <button type="button" onClick={onClose}>
        close-find
      </button>
    </div>
  ),
}));
import { EditorPane } from "./editor-pane";
import { liveExtension } from "../../../features/editor/live/live-extension";
import { focusDimming } from "../../../features/editor/focus/focus-dimming";
import { applySectionMove } from "../../../features/outline/apply-section-move";

describe("EditorPane", () => {
  beforeEach(() => {
    vi.mocked(liveExtension).mockClear();
    vi.mocked(focusDimming).mockClear();
    vi.mocked(applySectionMove).mockClear();
    clipboardReadTextMock.mockReset();
    clipboardWriteTextMock.mockReset();
    const settings = createDefaultSettings();
    useSettingsStore.setState({
      isHydrated: true,
      settings,
      templateDraft: settings.authoring.newDocumentTemplate,
    });
  });

  it("does not rewrite the editor text when the store's copy only differs in line endings", () => {
    useDocumentStore.setState({ content: "a\nb" });
    render(<EditorPane theme="light" />);
    mockState.dispatchSpy.mockClear();

    // The store keeps a file's own (here Windows) endings; the editor always holds plain \n.
    act(() => useDocumentStore.setState({ content: "a\r\nb" }));

    expect(mockState.dispatchSpy).not.toHaveBeenCalled();
  });

  it("hands the editor plain \\n text even when the file uses Windows line endings", () => {
    useDocumentStore.setState({ content: "a\r\nb" });
    render(<EditorPane theme="light" />);

    const { calls } = vi.mocked(EditorState.create).mock;
    expect(calls[calls.length - 1][0]).toMatchObject({ doc: "a\nb" });
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

  it("turns Live rendering on and off with the live flag, without rebuilding the editor", () => {
    vi.mocked(EditorState.create).mockClear();
    const { rerender } = render(<EditorPane theme="light" live={false} />);
    expect(liveExtension).not.toHaveBeenCalled();
    mockState.dispatchSpy.mockClear();

    rerender(<EditorPane theme="light" live />);
    expect(liveExtension).toHaveBeenCalledTimes(1);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith({ effects: { reconfigured: "live-extension" } });

    mockState.dispatchSpy.mockClear();
    rerender(<EditorPane theme="light" live={false} />);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith({ effects: { reconfigured: [] } });
    expect(EditorState.create).toHaveBeenCalledTimes(1);
  });

  it("is plain markdown when no live flag is given", () => {
    render(<EditorPane theme="light" />);
    expect(liveExtension).not.toHaveBeenCalled();
  });

  it("boots with Live rendering when it opens live", () => {
    render(<EditorPane theme="light" live />);
    expect(liveExtension).toHaveBeenCalledTimes(1);
  });

  it("turns paragraph dimming on and off with the focusDim flag, without rebuilding the editor", () => {
    vi.mocked(EditorState.create).mockClear();
    const { rerender } = render(<EditorPane theme="light" focusDim={false} />);
    expect(focusDimming).not.toHaveBeenCalled();
    mockState.dispatchSpy.mockClear();

    rerender(<EditorPane theme="light" focusDim />);
    expect(focusDimming).toHaveBeenCalledTimes(1);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith({ effects: { reconfigured: "focus-dimming" } });

    mockState.dispatchSpy.mockClear();
    rerender(<EditorPane theme="light" focusDim={false} />);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith({ effects: { reconfigured: [] } });
    expect(EditorState.create).toHaveBeenCalledTimes(1);
  });

  it("boots dimmed when it opens with focusDim", () => {
    render(<EditorPane theme="light" focusDim />);
    expect(focusDimming).toHaveBeenCalledTimes(1);
  });

  it("is not dimmed when no focusDim flag is given", () => {
    render(<EditorPane theme="light" />);
    expect(focusDimming).not.toHaveBeenCalled();
  });

  it("dims independently of Live rendering", () => {
    render(<EditorPane theme="light" live focusDim />);
    expect(liveExtension).toHaveBeenCalledTimes(1);
    expect(focusDimming).toHaveBeenCalledTimes(1);
  });

  it("applies a settings change to the live editor without rebuilding it (#13)", () => {
    vi.mocked(EditorState.create).mockClear();
    mockState.dispatchSpy.mockClear();
    render(<EditorPane theme="light" />);
    expect(EditorState.create).toHaveBeenCalledTimes(1);
    mockState.dispatchSpy.mockClear();

    act(() => {
      useSettingsStore.getState().updateAppearance({ editorFontSize: 20 });
    });

    expect(EditorState.create).toHaveBeenCalledTimes(1);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ effects: expect.objectContaining({ reconfigured: expect.anything() }) }),
    );
  });

  it("keeps the editor (and its undo history) when line numbers are toggled (#13)", () => {
    vi.mocked(EditorState.create).mockClear();
    render(<EditorPane theme="light" />);

    act(() => {
      useSettingsStore.getState().updateEditor({ lineNumbers: true });
    });

    expect(EditorState.create).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("editor-surface")).toHaveAttribute("data-line-numbers", "visible");
  });

  it("keeps the editor (and its undo history) when the theme changes, and tells it the new mode", () => {
    vi.mocked(EditorState.create).mockClear();
    const { rerender } = render(<EditorPane theme="light" />);
    mockState.dispatchSpy.mockClear();

    rerender(<EditorPane theme="dark" />);

    // Not rebuilt: the colours come from CSS variables, only CodeMirror's dark flag changes.
    expect(EditorState.create).toHaveBeenCalledTimes(1);
    expect(mockState.dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ effects: expect.objectContaining({ reconfigured: expect.anything() }) }),
    );
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

  it("applies edit actions through the editor command bridge", async () => {
    render(<EditorPane theme="light" />);

    await act(async () => {
      await useEditorCommandState.getState().runEditAction("selectAll");
    });

    expect(mockState.dispatchSpy).toHaveBeenCalled();
  });

  it("writes selected text through the tauri clipboard plugin when copying", async () => {
    // The app now launches with no document, so seed content for the editor to select.
    useDocumentStore.setState({ content: "copy me" });
    render(<EditorPane theme="light" />);

    await act(async () => {
      await useEditorCommandState.getState().runEditAction("copy");
    });

    expect(clipboardWriteTextMock).toHaveBeenCalled();
  });

  it("reads text through the tauri clipboard plugin when pasting", async () => {
    clipboardReadTextMock.mockResolvedValue("from clipboard");
    render(<EditorPane theme="light" />);

    await act(async () => {
      await useEditorCommandState.getState().runEditAction("paste");
    });

    expect(clipboardReadTextMock).toHaveBeenCalled();
    expect(mockState.dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({ insert: "from clipboard" }),
      }),
    );
  });

  it("renders a labeled editor region with a stable editing surface hook", () => {
    render(<EditorPane theme="light" />);

    expect(screen.getByRole("region", { name: "Editor" })).toBeInTheDocument();
    expect(screen.getByTestId("editor-surface")).toBeInTheDocument();
    // A framed pane on the editor surface colour; its inner surface fills the space for CodeMirror.
    const panel = screen.getByTestId("editor-surface").parentElement?.parentElement;
    expect(panel).toHaveClass("editor-pane__panel", "overflow-hidden", "border", "bg-editor");
    expect(screen.getByTestId("editor-surface")).toHaveClass("flex-1", "min-h-0", "overflow-hidden");
  });

  it("shows the slash command menu when the cursor is inside a slash token", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        docChanged: true,
        selectionSet: true,
        view: { hasFocus: true },
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

  it("shows an inline formatting flyout when text is selected", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        focusChanged: true,
        selectionSet: true,
        view: { hasFocus: true },
        state: {
          doc: {
            toString: () => "Hello world",
            lineAt: () => ({ number: 1, from: 0 }),
          },
          selection: {
            main: {
              head: 5,
              from: 0,
              to: 5,
            },
          },
        },
      });
    });

    expect(screen.getByRole("toolbar", { name: "Inline formatting" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("hides the inline formatting flyout when nothing is selected", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        focusChanged: true,
        selectionSet: true,
        view: { hasFocus: true },
        state: {
          doc: {
            toString: () => "Hello world",
            lineAt: () => ({ number: 1, from: 0 }),
          },
          selection: {
            main: {
              head: 5,
              from: 5,
              to: 5,
            },
          },
        },
      });
    });

    expect(screen.queryByRole("toolbar", { name: "Inline formatting" })).not.toBeInTheDocument();
  });

  it("hides the inline formatting flyout while the slash command menu is open", () => {
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        docChanged: true,
        selectionSet: true,
        focusChanged: true,
        view: { hasFocus: true },
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
    expect(screen.queryByRole("toolbar", { name: "Inline formatting" })).not.toBeInTheDocument();
  });

  it("applies inline flyout actions to the editor document", async () => {
    const user = userEvent.setup();
    render(<EditorPane theme="light" />);

    act(() => {
      mockState.updateListener?.({
        focusChanged: true,
        selectionSet: true,
        view: { hasFocus: true },
        state: {
          doc: {
            toString: () => "Hello world",
            lineAt: () => ({ number: 1, from: 0 }),
          },
          selection: {
            main: {
              head: 5,
              from: 0,
              to: 5,
            },
          },
        },
      });
    });

    await user.click(screen.getByRole("button", { name: "Bold" }));

    expect(mockState.dispatchSpy).toHaveBeenCalled();
    const lastCall = mockState.dispatchSpy.mock.calls[mockState.dispatchSpy.mock.calls.length - 1]?.[0];
    expect(lastCall).toMatchObject({
      changes: expect.objectContaining({
        insert: expect.stringContaining("**"),
      }),
    });
  });

  describe("find and replace (#14)", () => {
    it("opens the find bar from the Edit menu action", () => {
      render(<EditorPane theme="light" />);
      expect(screen.queryByRole("search")).not.toBeInTheDocument();

      act(() => {
        void useEditorCommandState.getState().runEditAction("find");
      });

      expect(screen.getByRole("search")).toHaveAttribute("data-mode", "find");
    });

    it("opens it with the replace row from the Replace action", () => {
      render(<EditorPane theme="light" />);

      act(() => {
        void useEditorCommandState.getState().runEditAction("replace");
      });

      expect(screen.getByRole("search")).toHaveAttribute("data-mode", "replace");
    });

    it("binds Ctrl+F and Ctrl+H, ahead of CodeMirror's own search panel", () => {
      render(<EditorPane theme="light" />);
      const bindings = Object.fromEntries(mockState.keybindings.map((binding) => [binding.key, binding.run]));

      expect(Object.keys(bindings)).toEqual(expect.arrayContaining(["Mod-f", "Mod-h"]));
      act(() => {
        bindings["Mod-h"]();
      });
      expect(screen.getByRole("search")).toHaveAttribute("data-mode", "replace");

      act(() => {
        bindings["Mod-f"]();
      });
      expect(screen.getByRole("search")).toHaveAttribute("data-mode", "find");
    });

    it("closes the bar from its close action", async () => {
      const user = userEvent.setup();
      render(<EditorPane theme="light" />);
      act(() => {
        void useEditorCommandState.getState().runEditAction("find");
      });

      await user.click(screen.getByRole("button", { name: "close-find" }));

      expect(screen.queryByRole("search")).not.toBeInTheDocument();
    });
  });

  describe("move section action", () => {
    it("moves a section through applySectionMove on the editor, and stops once the editor is gone", () => {
      const { unmount } = render(<EditorPane theme="light" />);

      act(() => useEditorCommandState.getState().moveSection(2, 0));
      expect(applySectionMove).toHaveBeenCalledTimes(1);
      expect(applySectionMove).toHaveBeenCalledWith(expect.anything(), 2, 0);

      unmount();
      act(() => useEditorCommandState.getState().moveSection(2, 0));
      expect(applySectionMove).toHaveBeenCalledTimes(1);
    });
  });

  describe("focus action", () => {
    it("lets the app put the keyboard focus in the editor, and stops once it is gone", () => {
      const focus = vi.spyOn(mockState.EditorView.prototype, "focus");
      const { unmount } = render(<EditorPane theme="light" />);

      act(() => useEditorCommandState.getState().focusEditor());
      expect(focus).toHaveBeenCalledTimes(1);

      unmount();
      act(() => useEditorCommandState.getState().focusEditor());
      expect(focus).toHaveBeenCalledTimes(1);
      focus.mockRestore();
    });
  });

  describe("go to line (#16)", () => {
    const goTo = (line: number) => {
      mockState.dispatchSpy.mockClear();
      act(() => useEditorCommandState.getState().goToLine(line));
      return mockState.dispatchSpy.mock.calls[0]?.[0];
    };

    it("puts the cursor at the start of the line and scrolls it into view", () => {
      render(<EditorPane theme="light" />);

      expect(goTo(3)).toMatchObject({
        selection: { anchor: 20 },
        effects: { scrollIntoView: { position: 20, options: { y: "start", yMargin: 24 } } },
      });
    });

    it("clamps a line past the end to the last line", () => {
      render(<EditorPane theme="light" />);

      expect(goTo(999)).toMatchObject({ selection: { anchor: 190 } });
    });

    it("clamps a line before the start to the first line", () => {
      render(<EditorPane theme="light" />);

      expect(goTo(0)).toMatchObject({ selection: { anchor: 0 } });
    });
  });
});
