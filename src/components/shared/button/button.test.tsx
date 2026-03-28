import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders a secondary button by default", () => {
    render(<Button>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toHaveClass(
      "rounded-app-sm",
      "bg-[color:var(--glass-elevated)]",
      "text-app-text",
    );
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

    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass("text-sm", "bg-app-accent");
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveClass("bg-transparent");
    expect(screen.getByRole("button", { name: "Danger" })).toHaveClass("text-red-700");
  });
});
