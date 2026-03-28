import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";

interface FloatingMenuProps extends HTMLAttributes<HTMLDivElement> {
  position: {
    top: number;
    left: number;
  };
  style?: CSSProperties;
}

export function FloatingMenu({
  position,
  style,
  children,
  className,
  ...props
}: PropsWithChildren<FloatingMenuProps>) {
  return (
    <div
      className={`absolute z-30 overflow-hidden rounded-[18px] border border-[color:var(--ghost-border)] bg-app-panel-strong/98 shadow-[0_18px_40px_rgba(30,43,52,0.16)] backdrop-blur-md ${className ?? ""}`}
      style={{ top: position.top, left: position.left, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
