import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceState } from "./workspace-state";

describe("workspace-state", () => {
  beforeEach(() => {
    useWorkspaceState.setState({ viewMode: "edit" });
  });

  it("defaults to edit mode", () => {
    expect(useWorkspaceState.getState().viewMode).toBe("edit");
  });

  it("switches the active view mode", () => {
    useWorkspaceState.getState().setViewMode("split");
    expect(useWorkspaceState.getState().viewMode).toBe("split");

    useWorkspaceState.getState().setViewMode("preview");
    expect(useWorkspaceState.getState().viewMode).toBe("preview");
  });
});
