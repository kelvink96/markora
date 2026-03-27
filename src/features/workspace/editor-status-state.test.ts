import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStatusState } from "./editor-status-state";

describe("editor-status-state", () => {
  beforeEach(() => {
    useEditorStatusState.setState({ line: 1, column: 1 });
  });

  it("defaults the cursor position to line 1, column 1", () => {
    expect(useEditorStatusState.getState().line).toBe(1);
    expect(useEditorStatusState.getState().column).toBe(1);
  });

  it("updates the cursor position", () => {
    useEditorStatusState.getState().setCursorPosition(12, 4);

    expect(useEditorStatusState.getState().line).toBe(12);
    expect(useEditorStatusState.getState().column).toBe(4);
  });
});
