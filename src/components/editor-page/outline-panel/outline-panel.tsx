import { ListTree, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Heading } from "../../../features/outline/extract-headings";

interface OutlinePanelProps {
  headings: Heading[];
  /** Index of the heading the cursor is under, or -1. */
  activeIndex: number;
  onSelect: (heading: Heading) => void;
  onClose: () => void;
}

export function OutlinePanel({ headings, activeIndex, onSelect, onClose }: OutlinePanelProps) {
  const activeItem = useRef<HTMLButtonElement>(null);

  // Keep the current section visible in a long outline as the cursor moves.
  useEffect(() => {
    activeItem.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Indent relative to the shallowest level in the document, so a document that starts at ## isn't pushed right.
  const topLevel = headings.length > 0 ? Math.min(...headings.map((heading) => heading.level)) : 1;

  return (
    <aside aria-label="Outline" data-tour="outline" className="flex h-full w-64 flex-col overflow-hidden rounded-xl border bg-card/80 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ListTree aria-hidden="true" className="size-4 text-muted-foreground" />
          Outline
        </h2>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Close outline" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {headings.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No headings yet. Start a line with <code className="rounded bg-muted px-1 font-mono text-xs">#</code> to add one.
        </p>
      ) : (
        <nav aria-label="Document headings" className="min-h-0 flex-1 overflow-auto p-1.5">
          <ul className="space-y-0.5">
            {headings.map((heading) => {
              const isActive = heading.index === activeIndex;

              return (
                <li key={heading.index}>
                  <button
                    ref={isActive ? activeItem : undefined}
                    type="button"
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => onSelect(heading)}
                    style={{ paddingLeft: `${0.5 + (heading.level - topLevel) * 0.85}rem` }}
                    className={cn(
                      "relative flex w-full cursor-pointer items-center rounded-md py-1.5 pr-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-3",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-linear-to-b before:from-brand-from before:to-brand-to"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      heading.level === topLevel && !isActive && "text-foreground",
                    )}
                  >
                    <span className="truncate">{heading.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
