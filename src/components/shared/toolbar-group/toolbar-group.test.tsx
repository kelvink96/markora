import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ToolbarGroup } from "./toolbar-group";

describe("ToolbarGroup", () => {
  it("renders a toolbar grouping container", () => {
    const { container } = render(
      <ToolbarGroup>
        <button type="button">One</button>
      </ToolbarGroup>,
    );

    expect(container.querySelector(".toolbar-group")).toBeTruthy();
  });
});
