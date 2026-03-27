import { type KeyboardEvent, type ReactNode, useCallback, useRef, useState } from "react";

interface WorkspaceProps {
  left: ReactNode;
  right: ReactNode;
}

export function Workspace({ left, right }: WorkspaceProps) {
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextPct = ((event.clientX - rect.left) / rect.width) * 100;

    // Clamp the divider so neither pane becomes unusably small.
    setSplitPct(Math.min(80, Math.max(20, nextPct)));
  }, []);

  const onDividerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSplitPct((value) => Math.max(20, value - step));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSplitPct((value) => Math.min(80, value + step));
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
        style={{ width: `${splitPct}%` }}
        role="region"
        aria-label="Editor workspace"
      >
        {left}
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
        style={{ width: `${100 - splitPct}%` }}
        role="region"
        aria-label="Preview workspace"
      >
        {right}
      </section>
    </div>
  );
}
