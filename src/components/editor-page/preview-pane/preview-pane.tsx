import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useDocumentStore } from "../../../store/document";
import { Panel } from "../../shared/panel";
import { getMarkdownAdapter } from "../../../platform/markdown";

export function PreviewPane() {
  // Subscribe only to the content field so this component updates when markdown text changes.
  const content = useDocumentStore((state) => state.content);
  const [html, setHtml] = useState("");
  const markdownAdapter = useMemo(() => getMarkdownAdapter(), []);

  useEffect(() => {
    markdownAdapter
      .render(content)
      .then((raw) => setHtml(DOMPurify.sanitize(raw)))
      .catch((error) => console.error("render preview failed:", error));
  }, [content, markdownAdapter]);

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <Panel className="preview-pane__surface h-full overflow-auto shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.14)]">
        <div
          className="preview-pane__content prose min-h-full w-full rounded-[calc(var(--radius-sm)-1px)] bg-app-preview p-[calc(var(--space-6)-0.1rem)]"
          data-testid="preview-content"
          // This HTML comes from our own Rust markdown renderer, not an external source.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
    </section>
  );
}
