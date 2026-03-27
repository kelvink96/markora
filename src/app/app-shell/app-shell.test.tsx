import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("applies the Tailwind shell layout classes and toggles the dark theme class", () => {
    const { rerender } = render(
      <AppShell
        theme="light"
        topBar={<div>Top Bar</div>}
        workspace={<div>Workspace</div>}
      />,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveClass("min-h-screen");
    expect(shell).toHaveClass("flex");
    expect(shell).toHaveClass("flex-col");
    expect(shell).toHaveClass("overflow-hidden");
    expect(shell).not.toHaveClass("theme-dark");

    rerender(
      <AppShell
        theme="dark"
        topBar={<div>Top Bar</div>}
        workspace={<div>Workspace</div>}
      />,
    );

    expect(screen.getByTestId("app-shell")).toHaveClass("theme-dark");
  });
});
