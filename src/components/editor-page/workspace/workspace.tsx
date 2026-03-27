import { type KeyboardEvent, type ReactNode, useCallback, useRef, useState } from "react";
import "./workspace.css";

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
      className="workspace"
      onMouseMove={onMouseMove}
      onMouseUp={() => {
        dragging.current = false;
      }}
      onMouseLeave={() => {
        dragging.current = false;
      }}
    >
      <section
        className="workspace__left"
        style={{ width: `${splitPct}%` }}
        role="region"
        aria-label="Editor workspace"
      >
        {left}
      </section>
      <div
        className="workspace__divider"
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
        className="workspace__right"
        style={{ width: `${100 - splitPct}%` }}
        role="region"
        aria-label="Preview workspace"
      >
        {right}
      </section>
    </div>
  );
}
