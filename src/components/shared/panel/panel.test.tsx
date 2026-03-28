import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "./panel";

describe("Panel", () => {
  it("renders a shared panel surface", () => {
    render(<Panel>Panel body</Panel>);

    expect(screen.getByText("Panel body")).toHaveClass("app-surface");
  });
});
