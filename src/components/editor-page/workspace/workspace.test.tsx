import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Workspace } from "./workspace";

describe("Workspace", () => {
  it("renders both panes", () => {
    const { getByText } = render(
      <Workspace left={<div>Left</div>} right={<div>Right</div>} />,
    );

    expect(getByText("Left")).toBeTruthy();
    expect(getByText("Right")).toBeTruthy();
  });

  it("renders a divider", () => {
    const { container } = render(<Workspace left={<div />} right={<div />} />);
    expect(container.querySelector(".workspace__divider")).toBeTruthy();
  });

  it("renders editor and preview panes as named regions", () => {
    render(<Workspace left={<div>Left</div>} right={<div>Right</div>} />);

    expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Preview workspace" })).toBeInTheDocument();
  });

  it("moves the split with keyboard arrows", () => {
    render(<Workspace left={<div>Left</div>} right={<div>Right</div>} />);

    const divider = screen.getByRole("separator", { name: "Resize editor and preview panes" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });

    expect(screen.getByText("Left").parentElement).toHaveStyle({ width: "55%" });
  });
});
