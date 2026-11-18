import { useEffect, type ReactNode } from "react";
import type { ColorScheme } from "../../features/settings/settings-schema";

// The browser / PWA chrome colour: each theme's background, so the window frame blends in.
const themeColor: Record<ColorScheme, Record<"light" | "dark", string>> = {
  standard: { light: "#f9fafe", dark: "#090b16" },
  sepia: { light: "#faf3e5", dark: "#130d09" },
  "high-contrast": { light: "#ffffff", dark: "#000000" },
};

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
    // The theme tokens key off :root.theme-dark; body keeps the class for portal content and dark: variants.
    document.documentElement.classList.toggle("theme-dark", themeMode === "dark");
    document.body.classList.toggle("theme-dark", themeMode === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", themeColor[colorScheme][themeMode]);

    return () => {
      document.documentElement.removeAttribute("data-theme-mode");
      document.documentElement.removeAttribute("data-color-scheme");
      document.documentElement.classList.remove("theme-dark");
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
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{workspace}</div>
      <div className="shrink-0">{statusBar}</div>
    </div>
  );
}
