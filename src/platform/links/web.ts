import type { LinkAdapter } from "./types";

export const webLinkAdapter: LinkAdapter = {
  async openExternal(url) {
    // noopener keeps the opened page from reaching back into this one.
    window.open(url, "_blank", "noopener,noreferrer");
  },
};
