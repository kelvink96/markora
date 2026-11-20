import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingWhatsNew,
  loadPendingWhatsNew,
  savePendingWhatsNew,
} from "./whats-new-storage";

const KEY = "markora:pending-whats-new";
const record = { version: "1.6.0", notes: "## What's Changed", publishedAt: "2026-11-20T10:00:00Z" };

describe("pending what's new storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("returns null when nothing is saved", () => {
    expect(loadPendingWhatsNew()).toBeNull();
  });

  it("round-trips a saved record", () => {
    savePendingWhatsNew(record);

    expect(loadPendingWhatsNew()).toEqual(record);
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem(KEY, "{nope");

    expect(loadPendingWhatsNew()).toBeNull();
  });

  it.each([["null"], ['"text"'], ["42"], ["[]"], ["{}"], ['{"version":""}'], ['{"version":7}']])(
    "returns null for the wrong shape %s",
    (stored) => {
      localStorage.setItem(KEY, stored);

      expect(loadPendingWhatsNew()).toBeNull();
    },
  );

  it("coerces a non-string notes to an empty string and a non-string publishedAt to null", () => {
    localStorage.setItem(KEY, JSON.stringify({ version: "1.6.0", notes: 5, publishedAt: 9 }));

    expect(loadPendingWhatsNew()).toEqual({ version: "1.6.0", notes: "", publishedAt: null });
  });

  it("clear removes the record", () => {
    savePendingWhatsNew(record);
    clearPendingWhatsNew();

    expect(loadPendingWhatsNew()).toBeNull();
  });

  it("save, load and clear do not throw when storage throws", () => {
    const boom = () => {
      throw new Error("storage blocked");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(boom);

    expect(() => savePendingWhatsNew(record)).not.toThrow();
    expect(loadPendingWhatsNew()).toBeNull();
    expect(() => clearPendingWhatsNew()).not.toThrow();
  });
});
