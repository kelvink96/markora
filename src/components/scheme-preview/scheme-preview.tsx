import { cn } from "@/lib/utils";
import type { ColorScheme } from "../../features/settings/color-schemes";

interface SchemePreviewProps {
  scheme: ColorScheme;
  mode: "light" | "dark";
  /** "default" for the settings cards, "mini" for menu entries. */
  size?: "default" | "mini";
  className?: string;
}

/**
 * A miniature of the app (title bar, editor half, preview half) drawn with a scheme's real colours.
 * themes.css paints anything carrying data-swatch-scheme and data-swatch-mode in that palette, so this
 * previews a scheme without switching the whole app. Settings and the View menu share the one drawing,
 * so they can't drift apart; a new scheme only needs its palette.
 */
export function SchemePreview({ scheme, mode, size = "default", className }: SchemePreviewProps) {
  const mini = size === "mini";
  // The editor and preview halves: each bar is a line of text, the coloured ones are the syntax roles.
  const bar = cn("block rounded-full", mini ? "h-[1.5px]" : "h-1");
  const muted = "bg-muted-foreground/50";
  // The preview half reads a little fainter, as it always has; the miniature needs a touch more to show at all.
  const previewMuted = mini ? "bg-muted-foreground/55" : "bg-muted-foreground/40";

  return (
    <div
      data-swatch-scheme={scheme}
      data-swatch-mode={mode}
      data-size={size}
      aria-hidden="true"
      className={cn(
        "overflow-hidden border bg-background",
        mini ? "inline-flex h-5 w-7 shrink-0 flex-col rounded-[4px]" : "rounded-md",
        className,
      )}
    >
      <div
        data-part="titlebar"
        className={cn("flex items-center border-b bg-card", mini ? "h-[5px] shrink-0 pl-[3px]" : "gap-1 px-2 py-1.5")}
      >
        {mini ? null : (
          <>
            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          </>
        )}
        <span className={cn("rounded-full bg-primary", mini ? "h-0.5 w-2" : "ml-1 h-1 w-6")} />
      </div>
      <div className={cn("grid grid-cols-2 gap-px bg-border", mini && "min-h-0 flex-1")}>
        <div data-part="editor" className={cn("flex flex-col bg-editor", mini ? "gap-[1.5px] p-0.5" : "gap-1 p-2")}>
          <span className={cn(bar, "w-2/3 bg-syntax-heading")} />
          <span className={cn(bar, "w-full", muted)} />
          {mini ? null : <span className={cn(bar, "w-5/6", muted)} />}
          <span className={cn(bar, "w-1/2 bg-syntax-link")} />
          {mini ? null : <span className={cn(bar, "w-3/5 bg-syntax-code")} />}
        </div>
        <div data-part="preview" className={cn("flex flex-col bg-preview", mini ? "gap-[1.5px] p-0.5" : "gap-1 p-2")}>
          <span className={cn("block rounded-full bg-foreground", mini ? "h-0.5 w-4/5" : "h-1.5 w-3/4")} />
          <span className={cn(bar, "w-full", previewMuted)} />
          {mini ? null : <span className={cn(bar, "w-5/6", previewMuted)} />}
          <span className={cn("block bg-primary", mini ? "h-[3px] w-2/5 rounded-[1px]" : "h-2 w-1/3 rounded")} />
        </div>
      </div>
    </div>
  );
}
