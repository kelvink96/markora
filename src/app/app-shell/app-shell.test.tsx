import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("applies the Tailwind shell layout classes and toggles the dark theme class", () => {
    const { rerender } = render(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveClass("h-screen");
    expect(shell).toHaveClass("h-dvh");
    expect(shell).toHaveClass("flex");
    expect(shell).toHaveClass("flex-col");
    expect(shell).toHaveClass("overflow-hidden");
    expect(shell).toHaveClass("bg-background");
    expect(shell).toHaveClass("text-foreground");
    expect(shell).toHaveClass("antialiased");
    expect(shell).not.toHaveClass("theme-dark");

    rerender(
      <AppShell
        themeMode="dark"
        colorScheme="sepia"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(screen.getByTestId("app-shell")).toHaveClass("theme-dark");
    expect(screen.getByTestId("app-shell")).toHaveClass("color-scheme-sepia");
  });

  it("syncs the document theme for portal-based UI", () => {
    const themeColorMeta = document.createElement("meta");
    themeColorMeta.setAttribute("name", "theme-color");
    document.head.appendChild(themeColorMeta);

    const { rerender } = render(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(document.documentElement).toHaveAttribute("data-theme-mode", "light");
    expect(document.documentElement).toHaveAttribute("data-color-scheme", "standard");
    expect(document.body).not.toHaveClass("theme-dark");
    expect(document.documentElement).not.toHaveClass("theme-dark");
    expect(themeColorMeta).toHaveAttribute("content", "#f9fafe");

    rerender(
      <AppShell
        themeMode="dark"
        colorScheme="sepia"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
    expect(document.documentElement).toHaveAttribute("data-color-scheme", "sepia");
    expect(document.body).toHaveClass("theme-dark");
    expect(document.documentElement).toHaveClass("theme-dark");
    expect(themeColorMeta).toHaveAttribute("content", "#130d09");
  });

  it("renders a footer status bar below the workspace", () => {
    render(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Status Bar")).toBeInTheDocument();
    expect(screen.getByText("Workspace").parentElement).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    );
  });

  it("renders the optional toolbar row only when one is given", () => {
    const { rerender } = render(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={null}
      />,
    );
    expect(screen.queryByText("Toolbar")).not.toBeInTheDocument();

    rerender(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        toolbar={<div>Toolbar</div>}
        workspace={<div>Workspace</div>}
        statusBar={null}
      />,
    );
    expect(screen.getByText("Toolbar")).toBeInTheDocument();
  });

  it("bounds the workspace to the window so the editor and preview scroll on their own (#12)", () => {
    render(
      <AppShell
        themeMode="light"
        colorScheme="standard"
        header={<div>Header</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    // The workspace's flex-1 / min-h-0 only apply inside a flex container. As a plain block
    // it grew to the full document height and the whole shell scrolled as one page, so
    // neither pane had a scroll position of its own.
    expect(screen.getByText("Workspace").parentElement).toHaveClass("flex", "flex-col");
  });
});
