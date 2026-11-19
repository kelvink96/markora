import { detectPlatform } from "../runtime";
import { desktopUpdateAdapter } from "./desktop";
import type { UpdateAdapter } from "./types";
import { webUpdateAdapter } from "./web";

export * from "./types";

export function getUpdateAdapter(): UpdateAdapter {
  return detectPlatform() === "desktop" ? desktopUpdateAdapter : webUpdateAdapter;
}
