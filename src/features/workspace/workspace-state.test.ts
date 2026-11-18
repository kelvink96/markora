import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceState } from "./workspace-state";

describe("workspace state", () => {
  beforeEach(() => useWorkspaceState.setState({ viewMode: "edit", showOutline: false }));

  it("starts in edit view with the outline closed", () => {
    expect(useWorkspaceState.getState().viewMode).toBe("edit");
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("remembers the chosen view mode for the next launch", () => {
    localStorage.clear();

    useWorkspaceState.getState().setViewMode("live");

    expect(localStorage.getItem("markora:view-mode")).toBe("live");
  });

  describe("at launch", () => {
    afterEach(() => localStorage.clear());

    async function freshStore() {
      vi.resetModules();
      return (await import("./workspace-state")).useWorkspaceState;
    }

    it("opens a brand-new install in live", async () => {
      localStorage.clear();
      expect((await freshStore()).getState().viewMode).toBe("live");
    });

    it("opens an existing user with no saved mode in edit", async () => {
      localStorage.setItem("markora:session", "{}");
      expect((await freshStore()).getState().viewMode).toBe("edit");
    });

    it("opens in the last-used mode", async () => {
      localStorage.setItem("markora:view-mode", "preview");
      expect((await freshStore()).getState().viewMode).toBe("preview");
    });
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
