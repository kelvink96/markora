import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolbarGroup } from "./toolbar-group";

describe("ToolbarGroup", () => {
  it("renders a semantic grouping container", () => {
    render(
      <ToolbarGroup>
        <button type="button">One</button>
      </ToolbarGroup>,
    );

    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
  });
});
