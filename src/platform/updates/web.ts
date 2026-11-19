import type { UpdateAdapter } from "./types";

export const webUpdateAdapter: UpdateAdapter = {
  async checkForUpdate() {
    return null;
  },

  async downloadAndInstall() {
    throw new Error("In-app updates are only available in the desktop app");
  },

  async relaunch() {
    throw new Error("Relaunch is only available in the desktop app");
  },
};
