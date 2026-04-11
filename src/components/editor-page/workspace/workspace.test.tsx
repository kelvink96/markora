import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Workspace } from "./workspace";

describe("Workspace", () => {
  it("renders a split layout with a resizable divider", () => {
    const { getByText } = render(
      <Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="split" />,
    );

    const workspace = getByText("Left").closest(".workspace");
    expect(workspace).toHaveClass("flex", "min-h-0", "overflow-hidden", "gap-2", "px-3", "pb-3", "pt-2.5");
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize editor and preview panes" })).toHaveClass(
      "cursor-col-resize",
      "rounded-[999px]",
    );
  });

  it("moves the split with keyboard arrows", () => {
    render(<Workspace left={<div>Left</div>} right={<div>Right</div>} viewMode="split" />);
    const divider = screen.getByRole("separator", { name: "Resize editor and preview panes" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });

    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "55%" });
  });

  it("renders only the editor in edit mode", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="edit" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Preview workspace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator", { name: "Resize editor and preview panes" })).not.toBeInTheDocument();
  });

  it("renders a preview-dominant layout in preview mode", () => {
    render(<Workspace sidebar={<div>Sidebar</div>} left={<div>Left</div>} right={<div>Right</div>} viewMode="preview" />);

    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toHaveStyle({ width: "68%" });
    expect(screen.getByRole("region", { name: "Editor workspace" })).toHaveStyle({ width: "32%" });
  });
});
