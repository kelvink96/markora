import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadViewMode, saveViewMode } from "./view-mode-storage";

describe("view mode storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts a brand-new install (nothing stored) in live", () => {
    expect(loadViewMode()).toBe("live");
  });

  it("keeps existing users who have no stored mode on edit", () => {
    localStorage.setItem("markora:web-settings", "{}");
    expect(loadViewMode()).toBe("edit");

    localStorage.clear();
    localStorage.setItem("markora:session", "{}");
    expect(loadViewMode()).toBe("edit");
  });

  it("restores the last saved mode, whatever the other stored data says", () => {
    localStorage.setItem("markora:session", "{}");

    saveViewMode("preview");

    expect(loadViewMode()).toBe("preview");
  });

  it("ignores an unknown stored mode and falls back by the install rule", () => {
    localStorage.setItem("markora:view-mode", "sideways");
    expect(loadViewMode()).toBe("live");

    localStorage.setItem("markora:session", "{}");
    expect(loadViewMode()).toBe("edit");
  });

  it("falls back to live when storage is blocked, and saving does not throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadViewMode()).toBe("live");
    expect(() => saveViewMode("split")).not.toThrow();
  });
});
