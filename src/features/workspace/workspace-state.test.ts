import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceState } from "./workspace-state";

describe("workspace state", () => {
  beforeEach(() => useWorkspaceState.setState({ viewMode: "edit", showOutline: false }));

  it("starts in edit view with the outline closed", () => {
    expect(useWorkspaceState.getState().viewMode).toBe("edit");
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("toggles the outline open and closed", () => {
    useWorkspaceState.getState().toggleOutline();
    expect(useWorkspaceState.getState().showOutline).toBe(true);

    useWorkspaceState.getState().toggleOutline();
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("keeps the outline open when the view mode changes", () => {
    useWorkspaceState.getState().toggleOutline();

    useWorkspaceState.getState().setViewMode("split");

    expect(useWorkspaceState.getState().showOutline).toBe(true);
  });
});
