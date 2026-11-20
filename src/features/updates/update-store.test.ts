import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AvailableUpdate, DownloadProgress, UpdateAdapter } from "../../platform/updates";
import { useDocumentStore } from "../../store/document";
import { useUpdateStore } from "./update-store";
import { loadPendingWhatsNew } from "./whats-new-storage";

const adapter: {
  [K in keyof UpdateAdapter]: ReturnType<typeof vi.fn<UpdateAdapter[K]>>;
} = {
  getCurrentVersion: vi.fn<UpdateAdapter["getCurrentVersion"]>(),
  checkForUpdate: vi.fn<UpdateAdapter["checkForUpdate"]>(),
  download: vi.fn<UpdateAdapter["download"]>(),
  install: vi.fn<UpdateAdapter["install"]>(),
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
    adapter.download.mockReset();
    adapter.install.mockReset();
    adapter.relaunch.mockReset();
    localStorage.clear();
    useDocumentStore.setState(useDocumentStore.getInitialState(), true);
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

  describe("download", () => {
    it("downloads, records progress and ends ready without installing", async () => {
      resetStore({ status: "available", update });
      const seen: Array<DownloadProgress | null> = [];
      adapter.download.mockImplementation(async (onProgress) => {
        expect(useUpdateStore.getState().status).toBe("downloading");
        onProgress({ downloaded: 5, total: 10 });
        seen.push(useUpdateStore.getState().progress);
      });

      await useUpdateStore.getState().download();

      expect(seen).toEqual([{ downloaded: 5, total: 10 }]);
      expect(useUpdateStore.getState().status).toBe("ready");
      expect(adapter.install).not.toHaveBeenCalled();
      expect(adapter.relaunch).not.toHaveBeenCalled();
    });

    it("ends error and keeps the update on failure so retry works", async () => {
      resetStore({ status: "available", update });
      adapter.download.mockRejectedValueOnce(new Error("disk full"));

      await useUpdateStore.getState().download();

      expect(useUpdateStore.getState().status).toBe("error");
      expect(useUpdateStore.getState().error).toBe("disk full");
      expect(useUpdateStore.getState().update).toEqual(update);

      adapter.download.mockResolvedValueOnce();
      await useUpdateStore.getState().download();

      expect(useUpdateStore.getState().status).toBe("ready");
      expect(useUpdateStore.getState().error).toBeNull();
    });

    it.each(["idle", "checking", "up-to-date", "downloading", "ready"] as const)(
      "is a no-op while %s",
      async (status) => {
        resetStore({ status, update });

        await useUpdateStore.getState().download();

        expect(adapter.download).not.toHaveBeenCalled();
      },
    );

    it("is a no-op when in error without an update", async () => {
      resetStore({ status: "error", error: "x" });

      await useUpdateStore.getState().download();

      expect(adapter.download).not.toHaveBeenCalled();
    });
  });

  describe("restart", () => {
    it("is a no-op unless ready", async () => {
      resetStore({ status: "available", update });

      await useUpdateStore.getState().restart();

      expect(adapter.install).not.toHaveBeenCalled();
      expect(adapter.relaunch).not.toHaveBeenCalled();
    });

    it("installs, then relaunches once install returns", async () => {
      const calls: string[] = [];
      adapter.install.mockImplementation(async () => {
        calls.push("install");
      });
      adapter.relaunch.mockImplementation(async () => {
        calls.push("relaunch");
      });
      resetStore({ status: "ready", update });

      await useUpdateStore.getState().restart();

      expect(calls).toEqual(["install", "relaunch"]);
    });

    it("refuses to install while any document has unsaved changes", async () => {
      useDocumentStore.getState().openDocument({ content: "# Edited", filePath: "/edited.md", isDirty: true });
      resetStore({ status: "ready", update });

      await useUpdateStore.getState().restart();

      expect(adapter.install).not.toHaveBeenCalled();
      expect(adapter.relaunch).not.toHaveBeenCalled();
      expect(useUpdateStore.getState().status).toBe("ready");
      expect(useUpdateStore.getState().error).toBe("Save your changes before restarting.");
    });

    it("does not relaunch when install fails, and keeps the update ready to retry", async () => {
      adapter.install.mockRejectedValueOnce(new Error("installer failed"));
      resetStore({ status: "ready", update });

      await useUpdateStore.getState().restart();

      expect(adapter.relaunch).not.toHaveBeenCalled();
      expect(useUpdateStore.getState().status).toBe("ready");
      expect(useUpdateStore.getState().error).toBe("installer failed");
      expect(useUpdateStore.getState().update).toEqual(update);

      adapter.install.mockResolvedValueOnce();
      adapter.relaunch.mockResolvedValueOnce();
      await useUpdateStore.getState().restart();

      expect(adapter.relaunch).toHaveBeenCalledTimes(1);
      expect(useUpdateStore.getState().error).toBeNull();
    });

    it("surfaces a relaunch failure as the store error", async () => {
      adapter.install.mockResolvedValue();
      adapter.relaunch.mockRejectedValue(new Error("relaunch failed"));
      resetStore({ status: "ready", update });

      await useUpdateStore.getState().restart();

      expect(useUpdateStore.getState().status).toBe("ready");
      expect(useUpdateStore.getState().error).toBe("relaunch failed");
    });

    describe("what's new record", () => {
      const withNotes: AvailableUpdate = {
        version: "1.6.0",
        notes: "## What's Changed",
        publishedAt: "2026-11-20T10:00:00Z",
      };

      it("saves the version, notes and date before installing", async () => {
        let savedWhenInstalling: unknown = "not called";
        adapter.install.mockImplementation(async () => {
          savedWhenInstalling = loadPendingWhatsNew();
        });
        adapter.relaunch.mockResolvedValue();
        resetStore({ status: "ready", update: withNotes });

        await useUpdateStore.getState().restart();

        expect(savedWhenInstalling).toEqual({
          version: "1.6.0",
          notes: "## What's Changed",
          publishedAt: "2026-11-20T10:00:00Z",
        });
      });

      it("does not save when unsaved changes block the restart", async () => {
        useDocumentStore.getState().openDocument({ content: "# Edited", filePath: "/edited.md", isDirty: true });
        resetStore({ status: "ready", update: withNotes });

        await useUpdateStore.getState().restart();

        expect(loadPendingWhatsNew()).toBeNull();
      });

      it("clears the record when install rejects, so a failed attempt cannot show a toast later", async () => {
        adapter.install.mockRejectedValueOnce(new Error("installer cancelled"));
        resetStore({ status: "ready", update: withNotes });

        await useUpdateStore.getState().restart();

        expect(loadPendingWhatsNew()).toBeNull();
      });

      it("keeps the record when install succeeds but relaunch rejects", async () => {
        adapter.install.mockResolvedValue();
        adapter.relaunch.mockRejectedValue(new Error("relaunch failed"));
        resetStore({ status: "ready", update: withNotes });

        await useUpdateStore.getState().restart();

        expect(loadPendingWhatsNew()?.version).toBe("1.6.0");
      });

      it("still restarts when storage throws", async () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
          throw new Error("storage blocked");
        });
        adapter.install.mockResolvedValue();
        adapter.relaunch.mockResolvedValue();
        resetStore({ status: "ready", update: withNotes });

        await useUpdateStore.getState().restart();

        expect(adapter.install).toHaveBeenCalledTimes(1);
        expect(adapter.relaunch).toHaveBeenCalledTimes(1);
        vi.restoreAllMocks();
      });
    });
  });
});
