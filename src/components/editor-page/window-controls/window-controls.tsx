import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getWindowAdapter, type WindowAdapter } from "../../../platform/window";

/** How long the pointer rests on maximise before Snap Layouts opens; the delay tauri-plugin-decorum uses. */
export const SNAP_LAYOUTS_DELAY_MS = 620;

interface WindowControlsProps {
  /** Injected in tests; the app uses the platform's adapter. */
  adapter?: WindowAdapter;
  className?: string;
}

/**
 * Minimise, maximise/restore and close, drawn by Markora because the desktop window has no OS title bar.
 * Renders nothing on the web, where the browser owns the window.
 */
export function WindowControls({ adapter = getWindowAdapter(), className }: WindowControlsProps) {
  const [maximized, setMaximized] = useState(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelSnapLayouts = () => clearTimeout(snapTimer.current);
  useEffect(() => cancelSnapLayouts, []);

  useEffect(() => {
    if (!adapter.hasCustomTitleBar) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;
    const sync = () => {
      adapter
        .isMaximized()
        .then((value) => !disposed && setMaximized(value))
        .catch((error) => console.error("isMaximized failed:", error));
    };
    sync();
    // Maximise can also come from a double-click on the drag area, Win+Up or Snap, so follow the window.
    adapter
      .onResized(sync)
      .then((stop) => (disposed ? stop() : (unlisten = stop)))
      .catch((error) => console.error("onResized failed:", error));
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [adapter]);

  if (!adapter.hasCustomTitleBar) return null;

  const run = (action: () => Promise<void>, name: string) => () => {
    action().catch((error) => console.error(`${name} failed:`, error));
  };

  return (
    <div className={cn("flex shrink-0 self-stretch", className)} data-testid="window-controls">
      <CaptionButton label="Minimize" onClick={run(() => adapter.minimize(), "minimize")}>
        <Minus />
      </CaptionButton>
      <CaptionButton
        label={maximized ? "Restore" : "Maximize"}
        onClick={() => {
          cancelSnapLayouts();
          run(() => adapter.toggleMaximize(), "toggleMaximize")();
        }}
        // Windows 11 shows Snap Layouts when the pointer rests on the OS maximise button; ours has to ask for it.
        onMouseEnter={() => {
          cancelSnapLayouts();
          snapTimer.current = setTimeout(run(() => adapter.showSnapLayouts(), "showSnapLayouts"), SNAP_LAYOUTS_DELAY_MS);
        }}
        onMouseLeave={cancelSnapLayouts}
      >
        {maximized ? <Copy className="-scale-x-100" /> : <Square className="size-3!" />}
      </CaptionButton>
      <CaptionButton label="Close" danger onClick={run(() => adapter.close(), "close")}>
        <X />
      </CaptionButton>
    </div>
  );
}

interface CaptionButtonProps {
  label: string;
  danger?: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: ReactNode;
}

function CaptionButton({ label, danger = false, onClick, onMouseEnter, onMouseLeave, children }: CaptionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Like the OS caption buttons, these stay out of the Tab order; the keyboard has Alt+F4 and Win+arrows.
      tabIndex={-1}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "inline-flex w-11 items-center justify-center text-muted-foreground transition-colors [&_svg]:size-3.5 [&_svg]:stroke-[1.5]",
        danger ? "hover:bg-[#c42b1c] hover:text-white active:bg-[#c42b1c]/80" : "hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A draggable row for places where the header is hidden (Settings, Focus), so the window can still be
 * moved, maximised and closed. Renders nothing on the web.
 */
export function WindowDragStrip({ adapter = getWindowAdapter() }: { adapter?: WindowAdapter }) {
  if (!adapter.hasCustomTitleBar) return null;

  return (
    <div className="flex h-8 items-stretch" data-testid="window-drag-strip">
      <div className="flex-1" data-tauri-drag-region />
      <WindowControls adapter={adapter} />
    </div>
  );
}
