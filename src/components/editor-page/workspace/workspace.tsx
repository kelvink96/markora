import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceViewMode } from "../../../features/workspace/workspace-state";

interface WorkspaceProps {
  left: ReactNode;
  right: ReactNode;
  viewMode: WorkspaceViewMode;
}

export function Workspace({ left, right, viewMode }: WorkspaceProps) {
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (viewMode === "split") {
      setSplitPct(50);
    }

    if (viewMode === "preview") {
      setSplitPct(32);
    }
  }, [viewMode]);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextPct = ((event.clientX - rect.left) / rect.width) * 100;

    setSplitPct(Math.min(80, Math.max(20, nextPct)));
  }, []);

  const onDividerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSplitPct((current) => Math.max(20, current - step));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSplitPct((current) => Math.min(80, current + step));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setSplitPct(20);
    }

    if (event.key === "End") {
      event.preventDefault();
      setSplitPct(80);
    }
  }, []);

  if (viewMode === "edit") {
    return (
      <div className="workspace flex min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2.5">
        <section className="min-h-0 flex-1 overflow-hidden" role="region" aria-label="Editor workspace">
          {left}
        </section>
      </div>
    );
  }

  const editorWidth = splitPct;
  const previewWidth = 100 - splitPct;
  const primaryPane = viewMode === "preview" ? right : left;
  const secondaryPane = viewMode === "preview" ? left : right;
  const primaryLabel = viewMode === "preview" ? "Preview workspace" : "Editor workspace";
  const secondaryLabel = viewMode === "preview" ? "Editor workspace" : "Preview workspace";
  const primaryStyle = viewMode === "preview" ? { width: `${previewWidth}%` } : { width: `${editorWidth}%` };
  const secondaryStyle = viewMode === "preview" ? { width: `${editorWidth}%` } : { width: `${previewWidth}%` };

  return (
    <div
      ref={containerRef}
      className="workspace flex min-h-0 flex-1 gap-2 overflow-hidden px-3 pb-3 pt-2.5"
      onMouseMove={onMouseMove}
      onMouseUp={() => {
        dragging.current = false;
      }}
      onMouseLeave={() => {
        dragging.current = false;
      }}
    >
      <section
        className="min-h-0 overflow-hidden"
        style={primaryStyle}
        role="region"
        aria-label={primaryLabel}
      >
        {primaryPane}
      </section>
      <div
        className="workspace__divider h-auto w-3 shrink-0 cursor-col-resize rounded-[999px] bg-[linear-gradient(to_right,transparent,rgba(91,100,120,0.03),rgba(24,43,60,0.14),rgba(91,100,120,0.03),transparent)] outline-none transition-[background,transform] duration-150 hover:scale-y-[1.01] hover:bg-[linear-gradient(to_right,transparent,rgba(91,100,120,0.08),rgba(24,43,60,0.22),rgba(91,100,120,0.08),transparent)] focus-visible:bg-[linear-gradient(to_right,transparent,rgba(45,91,134,0.16),rgba(45,91,134,0.34),rgba(45,91,134,0.16),transparent)]"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and preview panes"
        tabIndex={0}
        onKeyDown={onDividerKeyDown}
        onMouseDown={() => {
          dragging.current = true;
        }}
      />
      <section
        className="min-h-0 overflow-hidden"
        style={secondaryStyle}
        role="region"
        aria-label={secondaryLabel}
      >
        {secondaryPane}
      </section>
    </div>
  );
}
