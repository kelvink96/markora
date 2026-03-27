import type { PropsWithChildren } from "react";
import "./toolbar-group.css";

export function ToolbarGroup({ children }: PropsWithChildren) {
  return <div className="toolbar-group">{children}</div>;
}
