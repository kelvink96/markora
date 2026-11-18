import { detectPlatform } from "../runtime";
import { desktopLinkAdapter } from "./desktop";
import { webLinkAdapter } from "./web";

export * from "./types";

export function getLinkAdapter() {
  return detectPlatform() === "desktop" ? desktopLinkAdapter : webLinkAdapter;
}
