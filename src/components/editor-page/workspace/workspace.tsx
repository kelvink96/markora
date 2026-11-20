import { type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../../../features/settings/settings-store";
import { useScrollSync } from "../../../features/workspace/use-scroll-sync";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

/** The editor's share of the split, in percent, is kept between these so neither pane collapses. */
const MIN_SPLIT = 20;
const MAX_SPLIT = 80;

// A 16rem sidebar leaves a phone-width editor a few characters wide, so below the md breakpoint it
// floats over the panes (positioned against the `relative` workspace box) instead of sitting beside them.
const SIDEBAR_SLOT =
  "min-h-0 shrink-0 overflow-hidden max-md:absolute max-md:inset-y-2.5 max-md:left-3 max-md:z-20 max-md:max-w-[calc(100%-1.5rem)] max-md:shadow-2xl";

interface WorkspaceProps {
  sidebar?: ReactNode;
  left: ReactNode;
  right: ReactNode;
  viewMode: WorkspaceViewMode;
}

export function Workspace({ sidebar, left, right, viewMode }: WorkspaceProps) {
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const syncScroll = useSettingsStore((state) => state.settings.preview.syncScroll);
  // Only Side-by-side shows both panes at once, so only there is there anything to keep in step.
  useScrollSync(containerRef, viewMode === "split" && syncScroll);

  useEffect(() => {
    if (viewMode === "split") {
      setSplitPct(50);
    }
  }, [viewMode]);

  // Pointer events cover mouse, pen and touch alike. Capturing the pointer keeps the drag going even
  // when it leaves the thin divider, and the divider's `touch-none` stops a touch drag from scrolling.
  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const nextPct = ((event.clientX - rect.left) / rect.width) * 100;

    setSplitPct(Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Math.round(nextPct))));
  }, []);

  const onPointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const onDividerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSplitPct((current) => Math.max(MIN_SPLIT, current - step));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSplitPct((current) => Math.min(MAX_SPLIT, current + step));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setSplitPct(MIN_SPLIT);
    }

    if (event.key === "End") {
      event.preventDefault();
      setSplitPct(MAX_SPLIT);
    }
  }, []);

  // One tree for all three views. The editor's section is always the first child of the pane box, so
  // React keeps it mounted (undo history, cursor, find bar) whichever view is chosen; Read only hides
  // it, and the preview section after it is shared by Side-by-side and Read for the same reason.
  const split = viewMode === "split";
  const reading = viewMode === "read";

  return (
    <div className={`workspace relative flex min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2.5 gap-2`}>
      {sidebar ? <div className={SIDEBAR_SLOT}>{sidebar}</div> : null}
      {/* The panes' percentage widths (and the divider drag) are measured against this box, so a
          sidebar beside it takes its width off the panes instead of pushing them out of the window. */}
      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 gap-2">
        <section
          className={split ? "min-h-0 overflow-hidden" : "min-h-0 flex-1 overflow-hidden"}
          style={split ? { width: `${splitPct}%` } : undefined}
          role="region"
          aria-label="Editor workspace"
          hidden={reading}
          aria-hidden={reading || undefined}
        >
          {left}
        </section>
        {split ? (
          <div
            className="workspace__divider relative h-auto w-3 shrink-0 cursor-col-resize touch-none rounded-full outline-none before:absolute before:inset-y-2 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-border before:transition-colors hover:before:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:before:bg-primary"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor and preview panes"
            // The editor's share of the width, in percent.
            aria-valuenow={splitPct}
            aria-valuemin={MIN_SPLIT}
            aria-valuemax={MAX_SPLIT}
            tabIndex={0}
            onKeyDown={onDividerKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          />
        ) : null}
        {split || reading ? (
          <section
            className={reading ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 overflow-hidden"}
            style={split ? { width: `${100 - splitPct}%` } : undefined}
            role="region"
            aria-label={reading ? "Reader workspace" : "Preview workspace"}
          >
            {right}
          </section>
        ) : null}
      </div>
    </div>
  );
}
