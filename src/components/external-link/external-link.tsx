import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getLinkAdapter } from "../../platform/links";

interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  href: string;
}

/**
 * A link to a web page outside the app. It stays a real link (a screen reader calls it one and the
 * address shows on hover), but a click opens it through the platform's LinkAdapter: in the desktop
 * webview a plain target="_blank" link would not reach the system browser.
 */
export function ExternalLink({ href, className, onClick, ...props }: ExternalLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        getLinkAdapter()
          .openExternal(href)
          .catch((error) => console.error("open link failed:", error));
      }}
      className={cn("inline-block text-primary underline underline-offset-4", className)}
      {...props}
    />
  );
}
