import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorCommandState } from "./editor-command-state";

describe("editor-command-state", () => {
  beforeEach(() => {
    useEditorCommandState.setState({ runToolbarAction: () => {}, runEditAction: async () => {} });
  });

  it("runs the registered toolbar action handler", () => {
    const handler = vi.fn();
    useEditorCommandState.getState().setRunToolbarAction(handler);
    useEditorCommandState.getState().runToolbarAction("bold");
    expect(handler).toHaveBeenCalledWith("bold");
  });

  it("runs the registered edit action handler", async () => {
    const handler = vi.fn();
    useEditorCommandState.getState().setRunEditAction(handler);
    await useEditorCommandState.getState().runEditAction("selectAll");
    expect(handler).toHaveBeenCalledWith("selectAll");
  });
});
