import { beforeEach, describe, expect, it, vi } from "vitest";
import { desktopUpdateAdapter } from "./desktop";

const { checkMock, relaunchMock, getVersionMock, invokeMock } = vi.hoisted(() => ({
  checkMock: vi.fn(),
  relaunchMock: vi.fn(),
  getVersionMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));
vi.mock("@tauri-apps/api/app", () => ({ getVersion: getVersionMock }));
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

  describe("pending what's new record", () => {
    const record = { version: "1.6.0", notes: "## What's Changed", publishedAt: "2026-11-20T10:00:00Z" };

    beforeEach(() => {
      invokeMock.mockReset();
    });

    it("saves through the Rust command", async () => {
      invokeMock.mockResolvedValue(undefined);

      await desktopUpdateAdapter.savePendingWhatsNew(record);

      expect(invokeMock).toHaveBeenCalledWith("save_pending_whats_new", { record });
    });

    it("lets a failed save reject so the caller can decide", async () => {
      invokeMock.mockImplementation(async () => {
        throw new Error("disk full");
      });

      await expect(desktopUpdateAdapter.savePendingWhatsNew(record)).rejects.toThrow("disk full");
    });

    it("loads the saved record", async () => {
      invokeMock.mockResolvedValue(record);

      await expect(desktopUpdateAdapter.loadPendingWhatsNew()).resolves.toEqual(record);
      expect(invokeMock).toHaveBeenCalledWith("load_pending_whats_new");
    });

    it.each([[null], [undefined], [{}], [{ version: "" }], [{ version: 7 }], ["text"]])(
      "loads %j as no record",
      async (value) => {
        invokeMock.mockResolvedValue(value);

        await expect(desktopUpdateAdapter.loadPendingWhatsNew()).resolves.toBeNull();
      },
    );

    it("loads no record, rather than failing the launch, when the command fails", async () => {
      invokeMock.mockImplementation(async () => {
        throw new Error("unreadable");
      });

      await expect(desktopUpdateAdapter.loadPendingWhatsNew()).resolves.toBeNull();
    });

    it("clears through the Rust command", async () => {
      invokeMock.mockResolvedValue(undefined);

      await desktopUpdateAdapter.clearPendingWhatsNew();

      expect(invokeMock).toHaveBeenCalledWith("clear_pending_whats_new");
    });
  });

  it("returns the running app version", async () => {
    getVersionMock.mockResolvedValue("1.6.0");

    await expect(desktopUpdateAdapter.getCurrentVersion()).resolves.toBe("1.6.0");
  });

  it("returns null when the app version cannot be read", async () => {
    getVersionMock.mockRejectedValue(new Error("no tauri"));

    await expect(desktopUpdateAdapter.getCurrentVersion()).resolves.toBeNull();
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

  it("checks with a 30 second timeout", async () => {
    checkMock.mockResolvedValue(null);

    await desktopUpdateAdapter.checkForUpdate();

    expect(checkMock).toHaveBeenCalledWith({ timeout: 30_000 });
  });

  it("downloads with a 10 minute timeout", async () => {
    const pending = fakeUpdate();
    checkMock.mockResolvedValue(pending);
    await desktopUpdateAdapter.checkForUpdate();

    await desktopUpdateAdapter.download(vi.fn());

    expect(pending.download).toHaveBeenCalledWith(expect.any(Function), { timeout: 600_000 });
  });

  it("closes the previous update before replacing it on a re-check", async () => {
    const first = fakeUpdate();
    const second = fakeUpdate({ version: "1.6.0" });
    checkMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    await desktopUpdateAdapter.checkForUpdate();

    await desktopUpdateAdapter.checkForUpdate();
    await desktopUpdateAdapter.install();

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(first.install).not.toHaveBeenCalled();
    expect(second.install).toHaveBeenCalledTimes(1);
  });

  it("still re-checks when closing the previous update fails", async () => {
    const first = fakeUpdate({ close: vi.fn(async () => Promise.reject(new Error("gone"))) });
    checkMock.mockResolvedValueOnce(first).mockResolvedValueOnce(fakeUpdate({ version: "1.6.0" }));
    await desktopUpdateAdapter.checkForUpdate();

    await expect(desktopUpdateAdapter.checkForUpdate()).resolves.toMatchObject({ version: "1.6.0" });
  });

  it("forgets the update once it is installed", async () => {
    checkMock.mockResolvedValue(fakeUpdate());
    await desktopUpdateAdapter.checkForUpdate();

    await desktopUpdateAdapter.install();

    await expect(desktopUpdateAdapter.install()).rejects.toThrow("No update to install");
  });
});
