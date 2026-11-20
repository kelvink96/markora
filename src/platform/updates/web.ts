import type { UpdateAdapter } from "./types";

export const webUpdateAdapter: UpdateAdapter = {
  async getCurrentVersion() {
    return null;
  },

  async checkForUpdate() {
    return null;
  },

  async download() {
    throw new Error("In-app updates are only available in the desktop app");
  },

  async install() {
    throw new Error("In-app updates are only available in the desktop app");
  },

  async relaunch() {
    throw new Error("Relaunch is only available in the desktop app");
  },
};
