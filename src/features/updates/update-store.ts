import { create } from "zustand";
import { getUpdateAdapter, type AvailableUpdate, type DownloadProgress } from "../../platform/updates";
import { selectHasUnsavedChanges, useDocumentStore } from "../../store/document";

export const SAVE_BEFORE_RESTART = "Save your changes before restarting.";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "ready"
  | "error";

interface UpdateState {
  status: UpdateStatus;
  update: AvailableUpdate | null;
  progress: DownloadProgress | null;
  error: string | null;
  check: (options?: { silent?: boolean }) => Promise<void>;
  download: () => Promise<void>;
  /** Installs the downloaded update and relaunches; refuses while any tab has unsaved changes. */
  restart: () => Promise<void>;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useUpdateStore = create<UpdateState>()((set, get) => ({
  status: "idle",
  update: null,
  progress: null,
  error: null,
  check: async ({ silent = false } = {}) => {
    const { status } = get();
    if (status === "checking" || status === "downloading" || status === "ready") return;

    set({ status: "checking", error: null });
    try {
      const update = await getUpdateAdapter().checkForUpdate();
      set(update ? { status: "available", update } : { status: "up-to-date", update: null });
    } catch (error) {
      set(silent ? { status: "idle", error: null } : { status: "error", error: toMessage(error) });
    }
  },
  download: async () => {
    const { status, update } = get();
    const canDownload = status === "available" || (status === "error" && update !== null);
    if (!canDownload) return;

    set({ status: "downloading", progress: null, error: null });
    try {
      await getUpdateAdapter().download((progress) => set({ progress }));
      set({ status: "ready" });
    } catch (error) {
      set({ status: "error", error: toMessage(error) });
    }
  },
  restart: async () => {
    if (get().status !== "ready") return;
    // Installing closes the app (Windows exits right away), so re-check here rather than trusting the caller.
    if (selectHasUnsavedChanges(useDocumentStore.getState())) {
      set({ error: SAVE_BEFORE_RESTART });
      return;
    }

    set({ error: null });
    try {
      const adapter = getUpdateAdapter();
      await adapter.install();
      // Only reached where install returns (macOS/Linux); Windows has already exited.
      await adapter.relaunch();
    } catch (error) {
      // Stay ready with the downloaded update so the user can retry the restart.
      set({ error: toMessage(error) });
    }
  },
}));
