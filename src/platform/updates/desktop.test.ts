import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopUpdateAdapter } from "./desktop";

const { checkMock, relaunchMock } = vi.hoisted(() => ({
  checkMock: vi.fn(),
  relaunchMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({ check: checkMock }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: relaunchMock }));

describe("desktopUpdateAdapter", () => {
  beforeEach(async () => {
    checkMock.mockReset();
    relaunchMock.mockReset();
    // Clear any update handle kept from a previous test.
    checkMock.mockResolvedValue(null);
    await desktopUpdateAdapter.checkForUpdate();
    checkMock.mockReset();
  });

  it("returns null when no update is available", async () => {
    checkMock.mockResolvedValue(null);

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toBeNull();
  });

  it("maps the plugin update to an AvailableUpdate", async () => {
    checkMock.mockResolvedValue({
      version: "1.5.0",
      body: "Fixes",
      date: "2026-12-01T00:00:00Z",
      downloadAndInstall: vi.fn(),
    });

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toEqual({
      version: "1.5.0",
      notes: "Fixes",
      publishedAt: "2026-12-01T00:00:00Z",
    });
  });

  it("falls back to empty notes and null date", async () => {
    checkMock.mockResolvedValue({ version: "1.5.0", downloadAndInstall: vi.fn() });

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toEqual({
      version: "1.5.0",
      notes: "",
      publishedAt: null,
    });
  });

  it("forwards download progress", async () => {
    const downloadAndInstall = vi.fn(async (cb: (event: unknown) => void) => {
      cb({ event: "Started", data: { contentLength: 100 } });
      cb({ event: "Progress", data: { chunkLength: 40 } });
      cb({ event: "Progress", data: { chunkLength: 40 } });
      cb({ event: "Finished" });
    });
    checkMock.mockResolvedValue({ version: "1.5.0", downloadAndInstall });
    await desktopUpdateAdapter.checkForUpdate();
    const onProgress = vi.fn();

    await desktopUpdateAdapter.downloadAndInstall(onProgress);

    expect(onProgress).toHaveBeenNthCalledWith(1, { downloaded: 40, total: 100 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { downloaded: 80, total: 100 });
  });

  it("reports a null total when the size is unknown", async () => {
    const downloadAndInstall = vi.fn(async (cb: (event: unknown) => void) => {
      cb({ event: "Started", data: {} });
      cb({ event: "Progress", data: { chunkLength: 10 } });
    });
    checkMock.mockResolvedValue({ version: "1.5.0", downloadAndInstall });
    await desktopUpdateAdapter.checkForUpdate();
    const onProgress = vi.fn();

    await desktopUpdateAdapter.downloadAndInstall(onProgress);

    expect(onProgress).toHaveBeenCalledWith({ downloaded: 10, total: null });
  });

  it("rejects when there is no update to install", async () => {
    await expect(desktopUpdateAdapter.downloadAndInstall(vi.fn())).rejects.toThrow(
      "No update to install",
    );
  });

  it("relaunches through the process plugin", async () => {
    relaunchMock.mockResolvedValue(undefined);

    await desktopUpdateAdapter.relaunch();

    expect(relaunchMock).toHaveBeenCalledTimes(1);
  });
});
