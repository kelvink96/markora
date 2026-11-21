import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import type { UpdateAdapter } from "./types";

let pendingUpdate: Update | null = null;

/** The manifest is tiny; a check that takes longer than this is treated as failed. */
export const CHECK_TIMEOUT_MS = 30_000;
/** Generous so slow connections can still fetch the installer, but a stalled download eventually fails. */
export const DOWNLOAD_TIMEOUT_MS = 10 * 60_000;

export const desktopUpdateAdapter: UpdateAdapter = {
  async getCurrentVersion() {
    try {
      return await getVersion();
    } catch {
      return null;
    }
  },

  async savePendingWhatsNew(record) {
    await invoke("save_pending_whats_new", { record });
  },

  async loadPendingWhatsNew() {
    try {
      const record = await invoke<unknown>("load_pending_whats_new");
      if (typeof record !== "object" || record === null) return null;

      const { version, notes, publishedAt } = record as Record<string, unknown>;
      if (typeof version !== "string" || version.length === 0) return null;
      return {
        version,
        notes: typeof notes === "string" ? notes : "",
        publishedAt: typeof publishedAt === "string" ? publishedAt : null,
      };
    } catch {
      // An unreadable record must not get in the way of launching.
      return null;
    }
  },

  async clearPendingWhatsNew() {
    await invoke("clear_pending_whats_new");
  },

  async checkForUpdate() {
    // Release the backend resource (and any downloaded bytes) held by the previous check.
    await pendingUpdate?.close().catch(() => {});
    pendingUpdate = null;

    pendingUpdate = await check({ timeout: CHECK_TIMEOUT_MS });
    if (!pendingUpdate) return null;

    return {
      version: pendingUpdate.version,
      notes: pendingUpdate.body ?? "",
      publishedAt: pendingUpdate.date ?? null,
    };
  },

  async download(onProgress) {
    if (!pendingUpdate) throw new Error("No update to install");

    let downloaded = 0;
    let total: number | null = null;

    await pendingUpdate.download(
      (event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? null;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          onProgress({ downloaded, total });
        }
      },
      { timeout: DOWNLOAD_TIMEOUT_MS },
    );
  },

  async install() {
    if (!pendingUpdate) throw new Error("No update to install");
    // On Windows the plugin launches the installer and exits the app, so this never returns there.
    await pendingUpdate.install();
    pendingUpdate = null;
  },

  async relaunch() {
    await relaunch();
  },
};
