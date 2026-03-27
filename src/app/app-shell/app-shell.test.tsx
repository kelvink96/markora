import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("applies the Tailwind shell layout classes and toggles the dark theme class", () => {
    const { rerender } = render(
      <AppShell
        theme="light"
        tabStrip={<div>Tab Strip</div>}
        commandBar={<div>Command Bar</div>}
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
    expect(shell).toHaveClass("bg-app-bg");
    expect(shell).toHaveClass("text-app-text");
    expect(shell).toHaveClass("antialiased");
    expect(shell).not.toHaveClass("theme-dark");

    rerender(
      <AppShell
        theme="dark"
        tabStrip={<div>Tab Strip</div>}
        commandBar={<div>Command Bar</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(screen.getByTestId("app-shell")).toHaveClass("theme-dark");
  });

  it("syncs the document theme for portal-based UI", () => {
    const { rerender } = render(
      <AppShell
        theme="light"
        tabStrip={<div>Tab Strip</div>}
        commandBar={<div>Command Bar</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.body).not.toHaveClass("theme-dark");

    rerender(
      <AppShell
        theme="dark"
        tabStrip={<div>Tab Strip</div>}
        commandBar={<div>Command Bar</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.body).toHaveClass("theme-dark");
  });

  it("renders a footer status bar below the workspace", () => {
    render(
      <AppShell
        theme="light"
        tabStrip={<div>Tab Strip</div>}
        commandBar={<div>Command Bar</div>}
        workspace={<div>Workspace</div>}
        statusBar={<div>Status Bar</div>}
      />,
    );

    expect(screen.getByText("Tab Strip")).toBeInTheDocument();
    expect(screen.getByText("Command Bar")).toBeInTheDocument();
    expect(screen.getByText("Status Bar")).toBeInTheDocument();
    expect(screen.getByText("Workspace").parentElement).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    );
  });
});
