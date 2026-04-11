import { detectPlatform } from "../runtime";
import { desktopMarkdownAdapter } from "./desktop";
import { webMarkdownAdapter } from "./web";

export * from "./types";

export function getMarkdownAdapter() {
  return detectPlatform() === "desktop" ? desktopMarkdownAdapter : webMarkdownAdapter;
}
