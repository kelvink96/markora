import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import DOMPurify from "dompurify";
import { useDocumentStore } from "../../../store/document";
import { getMarkdownAdapter } from "../../../platform/markdown";
import { getLinkAdapter } from "../../../platform/links";
import { classifyLink } from "../../../features/preview/preview-links";
import { highlightCodeBlocks } from "../../../features/preview/highlight-code";
import { useSettingsStore } from "../../../features/settings/settings-store";

// DOMPurify's default URL allowlist plus Tauri's asset:// scheme, which the desktop
// renderer uses for images next to the open file (http://asset.localhost passes already).
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|asset):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

const CONTENT_WIDTH_MEASURE = { narrow: "60ch", normal: "72ch", wide: "90ch" } as const;

function sanitize(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_URI_REGEXP });
}

/** Swaps an image that failed to load for a visible, labelled placeholder. */
function replaceWithPlaceholder(image: HTMLImageElement) {
  const label = image.alt || image.getAttribute("src") || "image";
  const placeholder = document.createElement("span");
  placeholder.className = "preview-image-missing";
  placeholder.setAttribute("role", "img");
  placeholder.setAttribute("aria-label", `Image unavailable: ${label}`);
  placeholder.title = image.getAttribute("src") ?? "";
  placeholder.textContent = label;
  image.replaceWith(placeholder);
}

export function PreviewPane() {
  // Subscribe only to the fields that change the rendered output.
  const content = useDocumentStore((state) => state.content);
  const documentPath = useDocumentStore((state) => state.filePath);
  const previewFontScale = useSettingsStore((state) => state.settings.appearance.previewFontScale);
  const contentWidth = useSettingsStore((state) => state.settings.preview.contentWidth);
  const openLinksExternally = useSettingsStore((state) => state.settings.preview.openLinksExternally);
  const linkAdapter = useMemo(() => getLinkAdapter(), []);
  const [html, setHtml] = useState("");
  const markdownAdapter = useMemo(() => getMarkdownAdapter(), []);
  const contentRef = useRef<HTMLDivElement>(null);
  // Same object until the HTML changes: React 19 rewrites innerHTML whenever this object's
  // identity changes, even if the string is the same.
  const innerHtml = useMemo(() => ({ __html: html }), [html]);

  useEffect(() => {
    markdownAdapter
      .render(content, { documentPath })
      .then((raw) => setHtml(sanitize(highlightCodeBlocks(raw))))
      .catch((error) => console.error("render preview failed:", error));
  }, [content, documentPath, markdownAdapter]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Image load errors don't bubble, so listen in the capture phase.
    const handleError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        replaceWithPlaceholder(event.target);
      }
    };
    container.addEventListener("error", handleError, true);
    return () => container.removeEventListener("error", handleError, true);
  }, []);

  // The preview lives inside the app window, so following a link would replace the editor.
  // Every link click is stopped; only web, mail and in-page links then do anything.
  const handleLinkClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest("a[href]");
    if (!link) return;

    event.preventDefault();
    const target = classifyLink(link.getAttribute("href"));

    if (target.kind === "external" && openLinksExternally) {
      linkAdapter
        .openExternal(target.url)
        .catch((error) => console.error("open link failed:", error));
    }

    if (target.kind === "anchor") {
      const destination = Array.from(event.currentTarget.querySelectorAll("[id]")).find(
        (element) => element.id === target.id,
      );
      destination?.scrollIntoView({ block: "start" });
    }
  };

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      {/* The scroll container (scroll sync finds it by this class), framed on the preview surface colour. */}
      <div className="preview-pane__surface h-full overflow-auto rounded-xl border bg-preview shadow-sm">
        <div
          ref={contentRef}
          className="preview-pane__content prose min-h-full w-full"
          data-testid="preview-content"
          onClick={handleLinkClick}
          onAuxClick={handleLinkClick}
          style={
            {
              "--preview-font-scale": previewFontScale,
              "--preview-measure": CONTENT_WIDTH_MEASURE[contentWidth],
            } as CSSProperties
          }
          // Sanitized with DOMPurify above, whichever platform renderer produced it.
          dangerouslySetInnerHTML={innerHtml}
        />
      </div>
    </section>
  );
}
