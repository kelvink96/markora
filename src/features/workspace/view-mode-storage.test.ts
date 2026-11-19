import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keepEditForPreexistingData, loadViewState, saveShowSyntax, saveViewMode } from "./view-mode-storage";

const MODE_KEY = "markora:view-mode";
const SYNTAX_KEY = "markora:show-syntax";

describe("view mode storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts a brand-new install (nothing stored) in write with syntax off", () => {
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });
  });

  it("keeps existing users who have no stored mode on raw syntax", () => {
    localStorage.setItem("markora:web-settings", "{}");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: true });

    localStorage.clear();
    localStorage.setItem("markora:session", "{}");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: true });
  });

  it("migrates a stored live to write with syntax off", () => {
    localStorage.setItem(MODE_KEY, "live");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });
    expect(localStorage.getItem(MODE_KEY)).toBe("write");
    expect(localStorage.getItem(SYNTAX_KEY)).toBe("0");
  });

  it("migrates a stored edit to write with syntax on", () => {
    localStorage.setItem(MODE_KEY, "edit");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: true });
    expect(localStorage.getItem(MODE_KEY)).toBe("write");
    expect(localStorage.getItem(SYNTAX_KEY)).toBe("1");
  });

  it("migrates a stored split to split and preview to read, keeping the syntax choice", () => {
    localStorage.setItem(MODE_KEY, "split");
    localStorage.setItem(SYNTAX_KEY, "0");
    expect(loadViewState()).toEqual({ viewMode: "split", showSyntax: false });
    expect(localStorage.getItem(MODE_KEY)).toBe("split");

    localStorage.setItem(MODE_KEY, "preview");
    localStorage.setItem(SYNTAX_KEY, "1");
    expect(loadViewState()).toEqual({ viewMode: "read", showSyntax: true });
    expect(localStorage.getItem(MODE_KEY)).toBe("read");
  });

  it("gives a legacy split or preview user with no syntax choice the existing-install default", () => {
    localStorage.setItem("markora:session", "{}");
    localStorage.setItem(MODE_KEY, "preview");
    expect(loadViewState()).toEqual({ viewMode: "read", showSyntax: true });
  });

  it("restores the last saved mode and syntax, whatever the other stored data says", () => {
    localStorage.setItem("markora:session", "{}");

    saveViewMode("read");
    saveShowSyntax(false);

    expect(loadViewState()).toEqual({ viewMode: "read", showSyntax: false });
  });

  it("ignores an unknown stored mode and falls back by the install rule", () => {
    localStorage.setItem(MODE_KEY, "sideways");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });
    localStorage.clear();
    localStorage.setItem(MODE_KEY, "sideways");
    localStorage.setItem("markora:session", "{}");
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: true });
  });

  it("falls back to write when storage is blocked, and saving does not throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });
    expect(() => saveViewMode("split")).not.toThrow();
    expect(() => saveShowSyntax(true)).not.toThrow();
  });

  it("remembers the default it picked, so saving a session later does not flip a new user to raw syntax", () => {
    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });

    localStorage.setItem("markora:session", "{}");

    expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: false });
  });

  describe("keepEditForPreexistingData", () => {
    it("turns syntax on for a launch that only defaulted, when older data turns up, and keeps it", () => {
      expect(loadViewState().showSyntax).toBe(false);

      expect(keepEditForPreexistingData()).toBe(true);
      expect(loadViewState()).toEqual({ viewMode: "write", showSyntax: true });
    });

    it("does nothing once the user has chosen a mode or flipped syntax", () => {
      loadViewState();
      saveViewMode("write");
      expect(keepEditForPreexistingData()).toBe(false);

      localStorage.clear();
      loadViewState();
      saveShowSyntax(false);
      expect(keepEditForPreexistingData()).toBe(false);
      expect(loadViewState().showSyntax).toBe(false);
    });

    it("does nothing on a launch that restored stored values", () => {
      saveViewMode("write");
      saveShowSyntax(false);
      localStorage.setItem("markora:view-mode-default", "1");
      loadViewState();

      expect(keepEditForPreexistingData()).toBe(false);
    });
  });
});
