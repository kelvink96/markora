import type { PropsWithChildren } from "react";

interface ToolbarGroupProps extends PropsWithChildren {
  className?: string;
}

export function ToolbarGroup({ children, className }: ToolbarGroupProps) {
  return (
    <div role="group" className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      {children}
    </div>
  );
}
