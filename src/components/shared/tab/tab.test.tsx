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
    expect(tab.parentElement).toHaveClass("rounded-app-sm", "border");
  });

  it("renders optional left and right sections", () => {
    render(
      <Tab
        ariaSelected
        isActive
        leftSection={<span data-testid="tab-left">L</span>}
        rightSection={<span data-testid="tab-right">R</span>}
      >
        Notes
      </Tab>,
    );

    const tab = screen.getByRole("tab", { name: "Notes" });
    expect(screen.getByTestId("tab-left")).toBeInTheDocument();
    expect(screen.getByTestId("tab-right")).toBeInTheDocument();
    expect(tab.parentElement).toContainElement(screen.getByTestId("tab-left"));
    expect(tab.parentElement).toContainElement(screen.getByTestId("tab-right"));
    expect(screen.getByText("Notes")).toHaveClass("min-w-0");
  });
});
