import { describe, expect, it, vi } from "vitest";
import { webUpdateAdapter } from "./web";

describe("webUpdateAdapter", () => {
  it("never reports an update", async () => {
    await expect(webUpdateAdapter.checkForUpdate()).resolves.toBeNull();
  });

  it("rejects downloadAndInstall", async () => {
    await expect(webUpdateAdapter.downloadAndInstall(vi.fn())).rejects.toThrow();
  });

  it("rejects relaunch", async () => {
    await expect(webUpdateAdapter.relaunch()).rejects.toThrow();
  });
});
