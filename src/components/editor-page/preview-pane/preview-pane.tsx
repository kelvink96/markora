import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../../../store/document";
import { useSettingsStore } from "../../../features/settings/settings-store";

export function PreviewPane() {
  // Subscribe only to the content field so this component updates when markdown text changes.
  const content = useDocumentStore((state) => state.content);
  const readerTheme = useSettingsStore((state) => state.settings.preview.readerTheme);
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Call the Rust command by its registered name and pass the markdown argument object.
    invoke<string>("parse_markdown", { markdown: content })
      .then(setHtml)
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <div className="preview-pane__surface h-full overflow-auto rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] backdrop-blur-[var(--glass-blur-soft)] shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.14)]">
        <div
          className={`preview-pane__content preview-reader-theme preview-reader-theme-${readerTheme} prose min-h-full w-full rounded-[calc(var(--radius-sm)-1px)] p-[calc(var(--space-6)-0.1rem)]`}
          data-reader-theme={readerTheme}
          data-testid="preview-content"
          // This HTML comes from our own Rust markdown renderer, not an external source.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
