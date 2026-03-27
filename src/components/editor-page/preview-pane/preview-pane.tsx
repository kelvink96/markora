import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../../../store/document";

export function PreviewPane() {
  // Subscribe only to the content field so this component updates when markdown text changes.
  const content = useDocumentStore((state) => state.content);
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Call the Rust command by its registered name and pass the markdown argument object.
    invoke<string>("parse_markdown", { markdown: content })
      .then(setHtml)
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <section className="preview-pane h-full py-4 pl-0 pr-4" aria-label="Preview">
      <div className="preview-pane__surface h-full overflow-auto rounded-[var(--radius-xl)] border border-[var(--ghost-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),transparent_18%),var(--surface-preview)] shadow-[var(--shadow-ambient)]">
        <div
          className="preview-pane__content prose mx-auto max-w-[48rem] p-[calc(var(--space-6)+0.35rem)]"
          data-testid="preview-content"
          // This HTML comes from our own Rust markdown renderer, not an external source.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
