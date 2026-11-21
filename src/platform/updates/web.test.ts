import { describe, expect, it, vi } from "vitest";
import { webUpdateAdapter } from "./web";

describe("webUpdateAdapter", () => {
  it("never reports an update", async () => {
    await expect(webUpdateAdapter.checkForUpdate()).resolves.toBeNull();
  });

  it("has no known app version", async () => {
    await expect(webUpdateAdapter.getCurrentVersion()).resolves.toBeNull();
  });

  it("keeps no pending what's new record", async () => {
    await expect(webUpdateAdapter.savePendingWhatsNew({ version: "1.6.0", notes: "", publishedAt: null })).resolves.toBeUndefined();
    await expect(webUpdateAdapter.loadPendingWhatsNew()).resolves.toBeNull();
    await expect(webUpdateAdapter.clearPendingWhatsNew()).resolves.toBeUndefined();
  });

  it("rejects download", async () => {
    await expect(webUpdateAdapter.download(vi.fn())).rejects.toThrow();
  });

  it("rejects install", async () => {
    await expect(webUpdateAdapter.install()).rejects.toThrow();
  });

  it("rejects relaunch", async () => {
    await expect(webUpdateAdapter.relaunch()).rejects.toThrow();
  });
});
