import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { useDocumentStore } from "../../../store/document";

const previewWidthClasses = {
  narrow: "max-w-[36rem]",
  normal: "max-w-[44rem]",
  wide: "max-w-[56rem]",
} as const;

export function PreviewPane() {
  // Subscribe only to the content field so this component updates when markdown text changes.
  const content = useDocumentStore((state) => state.content);
  const previewWidth = useSettingsStore((state) => state.settings.preview.contentWidth);
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Call the Rust command by its registered name and pass the markdown argument object.
    invoke<string>("parse_markdown", { markdown: content })
      .then(setHtml)
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <div className="preview-pane__surface h-full overflow-auto rounded-[var(--radius-lg)] border border-[var(--ghost-border)] bg-app-preview shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
        <div
          className={`preview-pane__content prose mx-auto ${previewWidthClasses[previewWidth]} p-[calc(var(--space-6)-0.1rem)]`}
          data-testid="preview-content"
          // This HTML comes from our own Rust markdown renderer, not an external source.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
