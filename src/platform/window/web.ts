import type { WindowAdapter } from "./types";

// The browser owns the window, so there is nothing to control and no title bar to draw.
export const webWindowAdapter: WindowAdapter = {
  hasCustomTitleBar: false,
  async minimize() {},
  async toggleMaximize() {},
  async close() {},
  async isMaximized() {
    return false;
  },
  async showSnapLayouts() {},
  async onResized() {
    return () => {};
  },
};
