import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorCommandState } from "./editor-command-state";

describe("editor-command-state", () => {
  beforeEach(() => {
    useEditorCommandState.setState({ runToolbarAction: () => {}, runEditAction: async () => {}, focusEditor: () => {}, moveSection: () => {} });
  });

  it("runs the registered toolbar action handler", () => {
    const handler = vi.fn();
    useEditorCommandState.getState().setRunToolbarAction(handler);
    useEditorCommandState.getState().runToolbarAction("bold");
    expect(handler).toHaveBeenCalledWith("bold");
  });

  it("runs the registered focus handler, and does nothing before one is registered", () => {
    expect(() => useEditorCommandState.getState().focusEditor()).not.toThrow();

    const handler = vi.fn();
    useEditorCommandState.getState().setFocusEditor(handler);
    useEditorCommandState.getState().focusEditor();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("runs the registered move-section handler, and does nothing before one is registered", () => {
    expect(() => useEditorCommandState.getState().moveSection(1, 3)).not.toThrow();

    const handler = vi.fn();
    useEditorCommandState.getState().setMoveSection(handler);
    useEditorCommandState.getState().moveSection(1, 3);

    expect(handler).toHaveBeenCalledWith(1, 3);
  });

  it("runs the registered edit action handler", async () => {
    const handler = vi.fn();
    useEditorCommandState.getState().setRunEditAction(handler);
    await useEditorCommandState.getState().runEditAction("selectAll");
    expect(handler).toHaveBeenCalledWith("selectAll");
  });
});
