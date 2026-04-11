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
    expect(tab.parentElement).toHaveClass("relative", "rounded-app-md", "border", "shadow-[var(--shadow-crisp)]");
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

  it("renders an accent indicator on the active tab and not on inactive", () => {
    const { rerender } = render(<Tab ariaSelected isActive>Notes</Tab>);

    const wrapper = screen.getByRole("tab", { name: "Notes" }).parentElement!;
    expect(wrapper).toHaveClass("relative");
    expect(wrapper.className).toContain("after:absolute");

    rerender(<Tab ariaSelected={false} isActive={false}>Notes</Tab>);
    const inactiveWrapper = screen.getByRole("tab", { name: "Notes" }).parentElement!;
    expect(inactiveWrapper.className).not.toContain("after:absolute");
  });
});
