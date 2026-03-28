import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toolbar } from "./toolbar";

describe("Toolbar", () => {
  it("renders a shared toolbar container", () => {
    render(<Toolbar ariaLabel="Formatting">Body</Toolbar>);

    expect(screen.getByLabelText("Formatting")).toHaveClass(
      "rounded-app-sm",
      "gap-0.5",
      "p-0.5",
    );
  });
});
