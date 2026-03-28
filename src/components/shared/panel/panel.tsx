import type { HTMLAttributes, PropsWithChildren } from "react";

export function Panel({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] backdrop-blur-[var(--glass-blur-soft)] shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.16)] ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
