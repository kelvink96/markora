import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../../../store/document";
import "./preview-pane.css";

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
    <section className="preview-pane" aria-label="Preview">
      <div className="preview-pane__surface">
        <div
          className="preview-pane__content prose"
          // This HTML comes from our own Rust markdown renderer, not an external source.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
