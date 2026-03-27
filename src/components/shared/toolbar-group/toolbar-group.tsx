import type { PropsWithChildren } from "react";

export function ToolbarGroup({ children }: PropsWithChildren) {
  return (
    <div role="group" className="inline-flex items-center gap-1">
      {children}
    </div>
  );
}
