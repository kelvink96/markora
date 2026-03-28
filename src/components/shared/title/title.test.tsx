import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Title } from "./title";

describe("Title", () => {
  it("renders a level-two heading by default", () => {
    render(<Title>Section heading</Title>);

    const heading = screen.getByRole("heading", { level: 2, name: "Section heading" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("text-app-text", "font-semibold");
  });

  it("supports semantic override and variants", () => {
    render(
      <Title as="h3" size="lg" tone="muted" truncate>
        Dense shell heading
      </Title>,
    );

    const heading = screen.getByRole("heading", { level: 3, name: "Dense shell heading" });
    expect(heading.tagName).toBe("H3");
    expect(heading).toHaveClass("text-app-text-secondary", "truncate");
  });
});
