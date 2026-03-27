import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders the provided top bar and workspace", () => {
    render(
      <AppShell
        theme="light"
        topBar={<div>Top Bar</div>}
        workspace={<div>Workspace</div>}
      />,
    );

    expect(screen.getByText("Top Bar")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });
});
