import type { LinkAdapter } from "../../../platform/links";
import { classifyLink } from "../../preview/preview-links";

/**
 * Builds the handler for a Ctrl/Cmd+clicked link in the editor. It follows the same rules as the
 * preview pane: only web and mail links leave the app, and only when the 'Open links in your
 * browser' setting is on (read at click time, so changing it needs no editor rebuild).
 */
export function createLinkOpener(isEnabled: () => boolean, adapter: LinkAdapter) {
  return (href: string) => {
    const target = classifyLink(href);
    if (target.kind !== "external" || !isEnabled()) return;
    adapter.openExternal(target.url).catch((error) => console.error("open link failed:", error));
  };
}
