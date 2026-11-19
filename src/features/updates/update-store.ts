import { create } from "zustand";
import { getUpdateAdapter, type AvailableUpdate, type DownloadProgress } from "../../platform/updates";

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
  install: () => Promise<void>;
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
    if (status === "checking" || status === "downloading") return;

    set({ status: "checking", error: null });
    try {
      const update = await getUpdateAdapter().checkForUpdate();
      set(update ? { status: "available", update } : { status: "up-to-date", update: null });
    } catch (error) {
      set(silent ? { status: "idle", error: null } : { status: "error", error: toMessage(error) });
    }
  },
  install: async () => {
    const { status, update } = get();
    const canInstall = status === "available" || (status === "error" && update !== null);
    if (!canInstall) return;

    set({ status: "downloading", progress: null, error: null });
    try {
      await getUpdateAdapter().downloadAndInstall((progress) => set({ progress }));
      set({ status: "ready" });
    } catch (error) {
      set({ status: "error", error: toMessage(error) });
    }
  },
  restart: async () => {
    if (get().status !== "ready") return;
    await getUpdateAdapter().relaunch();
  },
}));
