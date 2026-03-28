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
      className={`app-toolbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto p-0.5 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
