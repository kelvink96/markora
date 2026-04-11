import { detectPlatform } from "../runtime";
import { desktopFileAdapter } from "./desktop";
import { webFileAdapter } from "./web";

export * from "./types";

export function getFileAdapter() {
  return detectPlatform() === "desktop" ? desktopFileAdapter : webFileAdapter;
}
