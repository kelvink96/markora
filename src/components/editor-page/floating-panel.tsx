import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface FloatingPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Where to place the panel, in pixels from the top-left of its positioned parent. */
  position: { top: number; left: number };
  style?: CSSProperties;
}

/** A small popover surface that sits at a point inside the editor (the slash menu, the selection toolbar). */
export function FloatingPanel({ position, style, children, className, ...props }: PropsWithChildren<FloatingPanelProps>) {
  return (
    <div
      className={cn(
        "absolute z-30 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
        className,
      )}
      style={{ top: position.top, left: position.left, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
