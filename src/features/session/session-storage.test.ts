import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSession, saveSession } from "./session-storage";

describe("session storage", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(loadSession()).toEqual({ openPaths: [], activePath: null });
  });

  it("round-trips a session", () => {
    saveSession({ openPaths: ["/a.md", "/b.md"], activePath: "/b.md" });

    expect(loadSession()).toEqual({ openPaths: ["/a.md", "/b.md"], activePath: "/b.md" });
  });

  it("treats corrupt data as an empty session", () => {
    localStorage.setItem("markora:session", "{nope");

    expect(loadSession()).toEqual({ openPaths: [], activePath: null });
  });

  it.each([["null"], ['"text"'], ["42"], ["[]"], ['{"openPaths":"/a.md"}']])(
    "treats the wrong shape %s as an empty session",
    (stored) => {
      localStorage.setItem("markora:session", stored);

      expect(loadSession()).toEqual({ openPaths: [], activePath: null });
    },
  );

  it("drops entries that aren't non-empty strings and removes duplicates", () => {
    localStorage.setItem(
      "markora:session",
      JSON.stringify({ openPaths: ["/a.md", 7, "", null, "/a.md", "/b.md"], activePath: "/a.md" }),
    );

    expect(loadSession()).toEqual({ openPaths: ["/a.md", "/b.md"], activePath: "/a.md" });
  });

  it("ignores an active path that isn't one of the open paths", () => {
    saveSession({ openPaths: ["/a.md"], activePath: "/elsewhere.md" });

    expect(loadSession().activePath).toBeNull();
  });

  it("doesn't throw when storage is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveSession({ openPaths: ["/a.md"], activePath: null })).not.toThrow();
    expect(loadSession()).toEqual({ openPaths: [], activePath: null });

    setItem.mockRestore();
    getItem.mockRestore();
  });
});
