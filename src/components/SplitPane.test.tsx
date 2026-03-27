import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SplitPane } from "./SplitPane";

describe("SplitPane", () => {
  it("renders both panes", () => {
    const { getByText } = render(
      <SplitPane left={<div>Left</div>} right={<div>Right</div>} />,
    );
    expect(getByText("Left")).toBeTruthy();
    expect(getByText("Right")).toBeTruthy();
  });

  it("renders a divider", () => {
    const { container } = render(<SplitPane left={<div />} right={<div />} />);
    expect(container.querySelector(".split-divider")).toBeTruthy();
  });
});
