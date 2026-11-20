import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceState } from "./workspace-state";

describe("workspace state", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceState.setState({ viewMode: "write", showSyntax: false, focusMode: false, showOutline: false });
  });

  it("starts in the write view, rendered, with the outline closed", () => {
    expect(useWorkspaceState.getState().viewMode).toBe("write");
    expect(useWorkspaceState.getState().showSyntax).toBe(false);
    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });

  it("remembers the chosen view mode for the next launch", () => {
    useWorkspaceState.getState().setViewMode("read");

    expect(localStorage.getItem("markora:view-mode")).toBe("read");
  });

  it("toggles Show syntax and remembers it for the next launch", () => {
    useWorkspaceState.getState().toggleSyntax();

    expect(useWorkspaceState.getState().showSyntax).toBe(true);
    expect(localStorage.getItem("markora:show-syntax")).toBe("1");

    useWorkspaceState.getState().setShowSyntax(false);

    expect(useWorkspaceState.getState().showSyntax).toBe(false);
    expect(localStorage.getItem("markora:show-syntax")).toBe("0");
  });

  it("keeps the Show syntax choice across Write, Side-by-side, Read and back", () => {
    useWorkspaceState.getState().toggleSyntax();

    useWorkspaceState.getState().setViewMode("split");
    useWorkspaceState.getState().setViewMode("read");
    useWorkspaceState.getState().setViewMode("write");

    expect(useWorkspaceState.getState().showSyntax).toBe(true);
  });

  describe("Focus", () => {
    it("starts off and toggles", () => {
      expect(useWorkspaceState.getState().focusMode).toBe(false);

      useWorkspaceState.getState().toggleFocus();
      expect(useWorkspaceState.getState().focusMode).toBe(true);

      useWorkspaceState.getState().toggleFocus();
      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("can be set directly", () => {
      useWorkspaceState.getState().setFocusMode(true);
      expect(useWorkspaceState.getState().focusMode).toBe(true);

      useWorkspaceState.getState().setFocusMode(false);
      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("turns off when the view changes to Side-by-side or Read, and stays on for Write", () => {
      useWorkspaceState.getState().setFocusMode(true);
      useWorkspaceState.getState().setViewMode("write");
      expect(useWorkspaceState.getState().focusMode).toBe(true);

      useWorkspaceState.getState().setViewMode("split");
      expect(useWorkspaceState.getState().focusMode).toBe(false);

      useWorkspaceState.getState().setFocusMode(true);
      useWorkspaceState.getState().setViewMode("read");
      expect(useWorkspaceState.getState().focusMode).toBe(false);
    });

    it("is never stored, so the app always opens normally", async () => {
      useWorkspaceState.getState().toggleFocus();
      expect(Object.keys(localStorage).filter((key) => key.toLowerCase().includes("focus"))).toEqual([]);

      vi.resetModules();
      const fresh = (await import("./workspace-state")).useWorkspaceState;
      expect(fresh.getState().focusMode).toBe(false);
    });
  });

  describe("at launch", () => {
    afterEach(() => localStorage.clear());

    async function freshStore() {
      vi.resetModules();
      return (await import("./workspace-state")).useWorkspaceState;
    }

    it("opens a brand-new install in write with syntax off", async () => {
      localStorage.clear();
      const state = (await freshStore()).getState();
      expect(state.viewMode).toBe("write");
      expect(state.showSyntax).toBe(false);
    });

    it("opens an existing user with no saved mode in write with syntax on", async () => {
      localStorage.setItem("markora:session", "{}");
      const state = (await freshStore()).getState();
      expect(state.viewMode).toBe("write");
      expect(state.showSyntax).toBe(true);
    });

    it("opens in the last-used mode", async () => {
      localStorage.setItem("markora:view-mode", "read");
      expect((await freshStore()).getState().viewMode).toBe("read");
    });

    it("opens a legacy edit user in write with syntax on", async () => {
      localStorage.setItem("markora:view-mode", "edit");
      const state = (await freshStore()).getState();
      expect(state.viewMode).toBe("write");
      expect(state.showSyntax).toBe(true);
    });

    it("turns syntax on when older data turns up after a launch that only defaulted", async () => {
      const store = await freshStore();
      expect(store.getState().showSyntax).toBe(false);

      store.getState().keepEditForPreexistingData();

      expect(store.getState().showSyntax).toBe(true);
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
