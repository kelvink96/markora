import { useEffect, type ReactNode } from "react";
import type { ColorScheme } from "../../features/settings/settings-schema";

const themeColorByMode = {
  light: "#f5f7fb",
  dark: "#111827",
} as const;

interface AppShellProps {
  themeMode: "light" | "dark";
  colorScheme: ColorScheme;
  tabStrip: ReactNode;
  commandBar: ReactNode;
  workspace: ReactNode;
  statusBar: ReactNode;
}

export function AppShell({
  themeMode,
  colorScheme,
  tabStrip,
  commandBar,
  workspace,
  statusBar,
}: AppShellProps) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme-mode", themeMode);
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
    document.body.classList.toggle("theme-dark", themeMode === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColorByMode[themeMode]);

    return () => {
      document.documentElement.removeAttribute("data-theme-mode");
      document.documentElement.removeAttribute("data-color-scheme");
      document.body.classList.remove("theme-dark");
    };
  }, [colorScheme, themeMode]);

  return (
    // Theme remains a class so the token layer can swap colors without extra JS.
    <div
      data-testid="app-shell"
      className={`color-scheme-${colorScheme} flex h-screen h-dvh w-full flex-col overflow-hidden bg-app-bg text-app-text antialiased ${themeMode === "dark" ? "theme-dark" : ""}`}
    >
      <div className="shrink-0">{tabStrip}</div>
      <div className="shrink-0">{commandBar}</div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{workspace}</div>
      <div className="shrink-0">{statusBar}</div>
    </div>
  );
}
