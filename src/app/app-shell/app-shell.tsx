import type { ReactNode } from "react";
import "./app-shell.css";

interface AppShellProps {
  theme: "light" | "dark";
  topBar: ReactNode;
  workspace: ReactNode;
}

export function AppShell({ theme, topBar, workspace }: AppShellProps) {
  return (
    // Theme remains a class so the token layer can swap colors without extra JS.
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <div className="app-shell__topbar">{topBar}</div>
      <div className="app-shell__workspace">{workspace}</div>
    </div>
  );
}
