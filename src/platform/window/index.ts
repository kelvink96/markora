import { detectPlatform } from "../runtime";
import { desktopWindowAdapter } from "./desktop";
import type { WindowAdapter } from "./types";
import { webWindowAdapter } from "./web";

export * from "./types";

export function getWindowAdapter(): WindowAdapter {
  return detectPlatform() === "desktop" ? desktopWindowAdapter : webWindowAdapter;
}
