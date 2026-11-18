import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useDocumentStore } from "../../../store/document";
import { Panel } from "../../shared/panel";
import { getMarkdownAdapter } from "../../../platform/markdown";

// DOMPurify's default URL allowlist plus Tauri's asset:// scheme, which the desktop
// renderer uses for images next to the open file (http://asset.localhost passes already).
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|asset):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

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
  const [html, setHtml] = useState("");
  const markdownAdapter = useMemo(() => getMarkdownAdapter(), []);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markdownAdapter
      .render(content, { documentPath })
      .then((raw) => setHtml(sanitize(raw)))
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

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <Panel className="preview-pane__surface h-full overflow-auto shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.14)]">
        <div
          ref={contentRef}
          className="preview-pane__content prose min-h-full w-full rounded-[calc(var(--radius-sm)-1px)] bg-app-preview p-[calc(var(--space-6)-0.1rem)]"
          data-testid="preview-content"
          // Sanitized with DOMPurify above, whichever platform renderer produced it.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
    </section>
  );
}
