import type { HTMLAttributes, PropsWithChildren } from "react";

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  ariaLabel: string;
}

export function Toolbar({
  ariaLabel,
  children,
  className,
  ...props
}: PropsWithChildren<ToolbarProps>) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-0.5 backdrop-blur-[var(--glass-blur-soft)] shadow-[var(--shadow-crisp)] ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
