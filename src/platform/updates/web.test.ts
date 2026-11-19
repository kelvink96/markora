import { describe, expect, it, vi } from "vitest";
import { webUpdateAdapter } from "./web";

describe("webUpdateAdapter", () => {
  it("never reports an update", async () => {
    await expect(webUpdateAdapter.checkForUpdate()).resolves.toBeNull();
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
