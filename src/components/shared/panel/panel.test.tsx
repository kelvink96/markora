import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "./panel";

describe("Panel", () => {
  it("renders a shared panel surface", () => {
    render(<Panel>Panel body</Panel>);

    expect(screen.getByText("Panel body")).toHaveClass(
      "rounded-app-sm",
      "shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.16)]",
    );
  });
});
