import { type ReactNode, useCallback, useRef, useState } from "react";

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
}

export function SplitPane({ left, right }: SplitPaneProps) {
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

  return (
    <div
      ref={containerRef}
      className="split-pane"
      onMouseMove={onMouseMove}
      onMouseUp={() => {
        dragging.current = false;
      }}
      onMouseLeave={() => {
        dragging.current = false;
      }}
    >
      <div className="split-left" style={{ width: `${splitPct}%` }}>
        {left}
      </div>
      <div
        className="split-divider"
        onMouseDown={() => {
          dragging.current = true;
        }}
      />
      <div className="split-right" style={{ width: `${100 - splitPct}%` }}>
        {right}
      </div>
    </div>
  );
}
