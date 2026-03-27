import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../store/document";

export function Preview() {
  const content = useDocumentStore((state) => state.content);
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Call the Rust command by its registered name and pass the markdown argument object.
    invoke<string>("parse_markdown", { markdown: content })
      .then(setHtml)
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <div
      className="preview-container"
      // This HTML comes from our own Rust markdown renderer, not an external source.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
