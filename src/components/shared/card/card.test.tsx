import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders a shared card surface", () => {
    render(<Card>Card body</Card>);

    expect(screen.getByText("Card body")).toHaveClass("app-surface");
  });
});
