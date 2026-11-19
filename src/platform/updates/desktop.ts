import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import type { UpdateAdapter } from "./types";

let pendingUpdate: Update | null = null;

export const desktopUpdateAdapter: UpdateAdapter = {
  async checkForUpdate() {
    pendingUpdate = await check();
    if (!pendingUpdate) return null;

    return {
      version: pendingUpdate.version,
      notes: pendingUpdate.body ?? "",
      publishedAt: pendingUpdate.date ?? null,
    };
  },

  async downloadAndInstall(onProgress) {
    if (!pendingUpdate) throw new Error("No update to install");

    let downloaded = 0;
    let total: number | null = null;

    await pendingUpdate.downloadAndInstall((event) => {
      if (event.event === "Started") {
        total = event.data.contentLength ?? null;
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
        onProgress({ downloaded, total });
      }
    });
  },

  async relaunch() {
    await relaunch();
  },
};
