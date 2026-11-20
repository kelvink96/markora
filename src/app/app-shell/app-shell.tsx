import { useEffect, type ReactNode } from "react";
import { COLOR_SCHEMES, type ColorScheme } from "../../features/settings/color-schemes";

// The browser / PWA chrome colour: each theme's background, so the window frame blends in.
const themeColor = Object.fromEntries(COLOR_SCHEMES.map((scheme) => [scheme.id, scheme.themeColor])) as Record<
  ColorScheme,
  Record<"light" | "dark", string>
>;

interface AppShellProps {
  themeMode: "light" | "dark";
  colorScheme: ColorScheme;
  /** The top row: logo, menus, tabs and view controls. */
  header: ReactNode;
  /** An optional slim row under the header (the formatting toolbar). */
  toolbar?: ReactNode;
  workspace: ReactNode;
  statusBar: ReactNode;
}

export function AppShell({
  themeMode,
  colorScheme,
  header,
  toolbar,
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
      className={`color-scheme-${colorScheme} flex h-screen h-dvh w-full flex-col overflow-hidden bg-background text-foreground antialiased ${themeMode === "dark" ? "theme-dark" : ""}`}
    >
      <div className="shrink-0">{header}</div>
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{workspace}</div>
      <div className="shrink-0">{statusBar}</div>
    </div>
  );
}
