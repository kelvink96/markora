import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyntaxToggle } from "./syntax-toggle";

describe("SyntaxToggle", () => {
  it("is a switch named Show syntax that reflects its state", () => {
    const { rerender } = render(<SyntaxToggle checked={false} onCheckedChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Show syntax" })).toHaveAttribute("aria-checked", "false");

    rerender(<SyntaxToggle checked onCheckedChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Show syntax" })).toHaveAttribute("aria-checked", "true");
  });

  it("asks for the opposite state when clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<SyntaxToggle checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch", { name: "Show syntax" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles from the keyboard", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<SyntaxToggle checked onCheckedChange={onCheckedChange} />);

    await user.tab();
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });
});
