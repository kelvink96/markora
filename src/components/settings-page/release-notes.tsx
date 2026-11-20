import { useEffect, useMemo, useState, type MouseEvent } from "react";
import DOMPurify from "dompurify";
import { getLinkAdapter } from "../../platform/links";
import { getMarkdownAdapter } from "../../platform/markdown";
import { linkifyBareUrls } from "../../features/preview/linkify";
import { classifyLink } from "../../features/preview/preview-links";

/** Release notes written in markdown, rendered by the platform adapter and sanitised like the preview. */
export function ReleaseNotes({ markdown }: { markdown: string }) {
  const [html, setHtml] = useState("");
  // Stable identity: React rewrites innerHTML whenever this object changes, even for the same string.
  const innerHtml = useMemo(() => ({ __html: html }), [html]);

  useEffect(() => {
    let current = true;
    getMarkdownAdapter()
      .render(markdown)
      .then((raw) => {
        if (current) setHtml(DOMPurify.sanitize(linkifyBareUrls(raw)));
      })
      .catch((error) => console.error("render release notes failed:", error));
    return () => {
      current = false;
    };
  }, [markdown]);

  // Following a link in place would replace the app, so every click is stopped and web links go to the browser.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!link) return;

    event.preventDefault();
    const target = classifyLink(link.getAttribute("href"));
    if (target.kind === "external") {
      getLinkAdapter()
        .openExternal(target.url)
        .catch((error) => console.error("open link failed:", error));
    }
  };

  return (
    <div
      className={
        "max-h-[230px] overflow-y-auto text-sm text-muted-foreground " +
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h1]:font-semibold [&_h1]:text-foreground " +
        "[&_h2]:mt-2 [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-medium [&_h3]:text-foreground " +
        "[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
      }
      onClick={handleClick}
      // Sanitized with DOMPurify above.
      dangerouslySetInnerHTML={innerHtml}
    />
  );
}
