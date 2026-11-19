import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AvailableUpdate, DownloadProgress, UpdateAdapter } from "../../platform/updates";
import { useUpdateStore } from "./update-store";

const adapter: {
  [K in keyof UpdateAdapter]: ReturnType<typeof vi.fn<UpdateAdapter[K]>>;
} = {
  checkForUpdate: vi.fn<UpdateAdapter["checkForUpdate"]>(),
  downloadAndInstall: vi.fn<UpdateAdapter["downloadAndInstall"]>(),
  relaunch: vi.fn<UpdateAdapter["relaunch"]>(),
};

vi.mock("../../platform/updates", () => ({
  getUpdateAdapter: () => adapter,
}));

const update: AvailableUpdate = { version: "1.2.0", notes: "Notes", publishedAt: null };

function resetStore(partial: Partial<ReturnType<typeof useUpdateStore.getState>> = {}) {
  useUpdateStore.setState({
    status: "idle",
    update: null,
    progress: null,
    error: null,
    ...partial,
  });
}

describe("update store", () => {
  beforeEach(() => {
    adapter.checkForUpdate.mockReset();
    adapter.downloadAndInstall.mockReset();
    adapter.relaunch.mockReset();
    resetStore();
  });

  describe("check", () => {
    it("goes checking then up-to-date when no update exists", async () => {
      let resolve!: (value: AvailableUpdate | null) => void;
      adapter.checkForUpdate.mockReturnValue(new Promise((r) => (resolve = r)));

      const pending = useUpdateStore.getState().check();
      expect(useUpdateStore.getState().status).toBe("checking");

      resolve(null);
      await pending;
      expect(useUpdateStore.getState().status).toBe("up-to-date");
      expect(useUpdateStore.getState().update).toBeNull();
    });

    it("sets available with the update", async () => {
      adapter.checkForUpdate.mockResolvedValue(update);

      await useUpdateStore.getState().check();

      expect(useUpdateStore.getState().status).toBe("available");
      expect(useUpdateStore.getState().update).toEqual(update);
    });

    it("ends idle with no error when a silent check fails", async () => {
      adapter.checkForUpdate.mockRejectedValue(new Error("offline"));

      await useUpdateStore.getState().check({ silent: true });

      expect(useUpdateStore.getState().status).toBe("idle");
      expect(useUpdateStore.getState().error).toBeNull();
    });

    it("ends error with the message when a non-silent check fails", async () => {
      adapter.checkForUpdate.mockRejectedValue(new Error("offline"));

      await useUpdateStore.getState().check();

      expect(useUpdateStore.getState().status).toBe("error");
      expect(useUpdateStore.getState().error).toBe("offline");
    });

    it.each(["checking", "downloading", "ready"] as const)("is a no-op while %s", async (status) => {
      resetStore({ status });

      await useUpdateStore.getState().check();

      expect(adapter.checkForUpdate).not.toHaveBeenCalled();
      expect(useUpdateStore.getState().status).toBe(status);
    });
  });

  describe("install", () => {
    it("downloads, records progress and ends ready", async () => {
      resetStore({ status: "available", update });
      const seen: Array<DownloadProgress | null> = [];
      adapter.downloadAndInstall.mockImplementation(async (onProgress) => {
        expect(useUpdateStore.getState().status).toBe("downloading");
        onProgress({ downloaded: 5, total: 10 });
        seen.push(useUpdateStore.getState().progress);
      });

      await useUpdateStore.getState().install();

      expect(seen).toEqual([{ downloaded: 5, total: 10 }]);
      expect(useUpdateStore.getState().status).toBe("ready");
    });

    it("ends error and keeps the update on failure so retry works", async () => {
      resetStore({ status: "available", update });
      adapter.downloadAndInstall.mockRejectedValueOnce(new Error("disk full"));

      await useUpdateStore.getState().install();

      expect(useUpdateStore.getState().status).toBe("error");
      expect(useUpdateStore.getState().error).toBe("disk full");
      expect(useUpdateStore.getState().update).toEqual(update);

      adapter.downloadAndInstall.mockResolvedValueOnce();
      await useUpdateStore.getState().install();

      expect(useUpdateStore.getState().status).toBe("ready");
      expect(useUpdateStore.getState().error).toBeNull();
    });

    it.each(["idle", "checking", "up-to-date", "downloading", "ready"] as const)(
      "is a no-op while %s",
      async (status) => {
        resetStore({ status, update });

        await useUpdateStore.getState().install();

        expect(adapter.downloadAndInstall).not.toHaveBeenCalled();
      },
    );

    it("is a no-op when in error without an update", async () => {
      resetStore({ status: "error", error: "x" });

      await useUpdateStore.getState().install();

      expect(adapter.downloadAndInstall).not.toHaveBeenCalled();
    });
  });

  describe("restart", () => {
    it("relaunches only when ready", async () => {
      resetStore({ status: "available", update });
      await useUpdateStore.getState().restart();
      expect(adapter.relaunch).not.toHaveBeenCalled();

      resetStore({ status: "ready", update });
      await useUpdateStore.getState().restart();
      expect(adapter.relaunch).toHaveBeenCalledTimes(1);
    });
  });
});
