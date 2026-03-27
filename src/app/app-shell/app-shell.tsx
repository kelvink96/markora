import type { ReactNode } from "react";

interface AppShellProps {
  theme: "light" | "dark";
  topBar: ReactNode;
  workspace: ReactNode;
}

export function AppShell({ theme, topBar, workspace }: AppShellProps) {
  return (
    // Theme remains a class so the token layer can swap colors without extra JS.
    <div
      data-testid="app-shell"
      className={`flex min-h-screen min-h-dvh w-full flex-col overflow-hidden bg-app-bg text-app-text antialiased ${theme === "dark" ? "theme-dark" : ""}`}
    >
      <div className="shrink-0">{topBar}</div>
      <div className="min-h-0 flex-1">{workspace}</div>
    </div>
  );
}
