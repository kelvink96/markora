import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tab } from "./tab";

describe("Tab", () => {
  it("renders a distinct tab primitive", () => {
    render(
      <Tab ariaSelected isActive>
        Notes
      </Tab>,
    );

    const tab = screen.getByRole("tab", { name: "Notes" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveClass("rounded-app-sm", "border");
  });
});
