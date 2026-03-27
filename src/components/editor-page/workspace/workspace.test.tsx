import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
});
