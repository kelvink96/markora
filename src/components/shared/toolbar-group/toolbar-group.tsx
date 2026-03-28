import type { PropsWithChildren } from "react";

interface ToolbarGroupProps extends PropsWithChildren {
  className?: string;
}

export function ToolbarGroup({ children, className }: ToolbarGroupProps) {
  return (
    <div
      role="group"
      className={`inline-flex items-center gap-0.5 rounded-app-sm border-r border-[color:color-mix(in_srgb,var(--glass-border)_55%,transparent)] pr-1 last:border-r-0 last:pr-0 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
