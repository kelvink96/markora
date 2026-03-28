import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../../../store/document";
import { Panel } from "../../shared/panel";

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
