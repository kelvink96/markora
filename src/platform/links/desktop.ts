import type { LinkAdapter } from "./types";

export const desktopLinkAdapter: LinkAdapter = {
  async openExternal(url) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  },
};
