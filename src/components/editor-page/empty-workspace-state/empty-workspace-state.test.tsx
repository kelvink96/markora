import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyWorkspaceState } from "./empty-workspace-state";
import { readShortcuts } from "../../shortcut-keys";

describe("EmptyWorkspaceState", () => {
  it("explains that nothing is open and offers the two ways to start", () => {
    render(<EmptyWorkspaceState onNewDocument={vi.fn()} onOpenFile={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Empty workspace" })).toBeInTheDocument();
    const heading = screen.getByRole("heading", { name: "No document open" });
    expect(heading).toHaveAttribute("data-slot", "empty-title");
    expect(heading.closest("[data-slot=empty]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "New document" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open file" })).toBeInTheDocument();
  });

  it("calls the matching handler for each action", async () => {
    const user = userEvent.setup();
    const onNewDocument = vi.fn();
    const onOpenFile = vi.fn();
    render(<EmptyWorkspaceState onNewDocument={onNewDocument} onOpenFile={onOpenFile} />);

    await user.click(screen.getByRole("button", { name: "New document" }));
    await user.click(screen.getByRole("button", { name: "Open file" }));

    expect(onNewDocument).toHaveBeenCalledTimes(1);
    expect(onOpenFile).toHaveBeenCalledTimes(1);
  });

  it("uses the label it is given for the open action (the web build says Import files)", () => {
    render(<EmptyWorkspaceState onNewDocument={vi.fn()} onOpenFile={vi.fn()} openFileLabel="Import files" />);

    expect(screen.getByRole("button", { name: "Import files" })).toBeInTheDocument();
  });

  it("shows the keyboard shortcuts for this platform, one key cap per key", () => {
    const { container } = render(<EmptyWorkspaceState onNewDocument={vi.fn()} onOpenFile={vi.fn()} />);

    expect(readShortcuts(container)).toEqual(["Ctrl+N", "Ctrl+O", "Ctrl+K"]);
  });
});
