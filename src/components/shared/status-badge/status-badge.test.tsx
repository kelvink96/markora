import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders a status badge with tone styling", () => {
    render(<StatusBadge tone="success">Saved</StatusBadge>);

    expect(screen.getByText("Saved")).toHaveClass("app-chip", "text-app-text-secondary");
  });
});
