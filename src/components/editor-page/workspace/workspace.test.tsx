import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Workspace } from "./workspace";

describe("Workspace", () => {
  it("applies the Tailwind split-pane layout and still renders both panes", () => {
    const { getByText } = render(
      <Workspace left={<div>Left</div>} right={<div>Right</div>} />,
    );

    const workspace = getByText("Left").closest(".workspace");
    expect(workspace).toHaveClass("flex");
    expect(workspace).toHaveClass("min-h-0");
    expect(workspace).toHaveClass("overflow-hidden");
    expect(workspace).toHaveClass("gap-2");
    expect(workspace).toHaveClass("px-3");
    expect(workspace).toHaveClass("pb-3");
    expect(workspace).toHaveClass("pt-2.5");

    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toBeInTheDocument();

    expect(screen.getByRole("separator", { name: "Resize editor and preview panes" })).toHaveClass(
      "cursor-col-resize",
      "rounded-[999px]",
    );
  });

  it("moves the split with keyboard arrows", () => {
    render(<Workspace left={<div>Left</div>} right={<div>Right</div>} />);
    const divider = screen.getByRole("separator", { name: "Resize editor and preview panes" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });

    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "55%" });
  });
});
