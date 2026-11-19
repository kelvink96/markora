import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopUpdateAdapter } from "./desktop";

const { checkMock, relaunchMock } = vi.hoisted(() => ({
  checkMock: vi.fn(),
  relaunchMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({ check: checkMock }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: relaunchMock }));

function fakeUpdate(overrides: Record<string, unknown> = {}) {
  return {
    version: "1.5.0",
    download: vi.fn(async () => {}),
    install: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    ...overrides,
  };
}

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
    checkMock.mockResolvedValue(fakeUpdate({ body: "Fixes", date: "2026-12-01T00:00:00Z" }));

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toEqual({
      version: "1.5.0",
      notes: "Fixes",
      publishedAt: "2026-12-01T00:00:00Z",
    });
  });

  it("falls back to empty notes and null date", async () => {
    checkMock.mockResolvedValue(fakeUpdate());

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toEqual({
      version: "1.5.0",
      notes: "",
      publishedAt: null,
    });
  });

  it("forwards download progress without installing", async () => {
    const pending = fakeUpdate({
      download: vi.fn(async (cb: (event: unknown) => void) => {
        cb({ event: "Started", data: { contentLength: 100 } });
        cb({ event: "Progress", data: { chunkLength: 40 } });
        cb({ event: "Progress", data: { chunkLength: 40 } });
        cb({ event: "Finished" });
      }),
    });
    checkMock.mockResolvedValue(pending);
    await desktopUpdateAdapter.checkForUpdate();
    const onProgress = vi.fn();

    await desktopUpdateAdapter.download(onProgress);

    expect(onProgress).toHaveBeenNthCalledWith(1, { downloaded: 40, total: 100 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { downloaded: 80, total: 100 });
    expect(pending.install).not.toHaveBeenCalled();
  });

  it("reports a null total when the size is unknown", async () => {
    const pending = fakeUpdate({
      download: vi.fn(async (cb: (event: unknown) => void) => {
        cb({ event: "Started", data: {} });
        cb({ event: "Progress", data: { chunkLength: 10 } });
      }),
    });
    checkMock.mockResolvedValue(pending);
    await desktopUpdateAdapter.checkForUpdate();
    const onProgress = vi.fn();

    await desktopUpdateAdapter.download(onProgress);

    expect(onProgress).toHaveBeenCalledWith({ downloaded: 10, total: null });
  });

  it("installs the downloaded update as a separate call", async () => {
    const pending = fakeUpdate();
    checkMock.mockResolvedValue(pending);
    await desktopUpdateAdapter.checkForUpdate();
    await desktopUpdateAdapter.download(vi.fn());
    expect(pending.install).not.toHaveBeenCalled();

    await desktopUpdateAdapter.install();

    expect(pending.download).toHaveBeenCalledTimes(1);
    expect(pending.install).toHaveBeenCalledTimes(1);
  });

  it("rejects download when there is no update", async () => {
    await expect(desktopUpdateAdapter.download(vi.fn())).rejects.toThrow("No update to install");
  });

  it("rejects install when there is no update", async () => {
    await expect(desktopUpdateAdapter.install()).rejects.toThrow("No update to install");
  });

  it("relaunches through the process plugin", async () => {
    relaunchMock.mockResolvedValue(undefined);

    await desktopUpdateAdapter.relaunch();

    expect(relaunchMock).toHaveBeenCalledTimes(1);
  });
});
