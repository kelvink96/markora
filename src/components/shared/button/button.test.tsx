import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders a secondary button by default", () => {
    render(<Button>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toHaveClass("rounded-app-md", "shadow-[var(--shadow-crisp)]", "text-app-text");
  });

  it("supports primary, ghost, and danger variants with sizing", () => {
    render(
      <>
        <Button variant="primary" size="sm">
          Primary
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass(
      "text-sm",
      "text-[color:var(--surface-panel-strong)]",
    );
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveClass("bg-transparent");
    expect(screen.getByRole("button", { name: "Danger" })).toHaveClass("text-red-700");
  });

  it("renders optional left and right sections around the main label", () => {
    render(
      <Button
        leftSection={<span data-testid="button-left">L</span>}
        rightSection={<span data-testid="button-right">R</span>}
      >
        Library
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Library" });
    expect(screen.getByTestId("button-left")).toBeInTheDocument();
    expect(screen.getByTestId("button-right")).toBeInTheDocument();
    expect(button).toContainElement(screen.getByTestId("button-left"));
    expect(button).toContainElement(screen.getByTestId("button-right"));
    expect(screen.getByText("Library")).toHaveClass("min-w-0");
  });
});
