import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("calls the checked handler", () => {
    const onCheckedChange = vi.fn();
    const { getByRole } = render(
      <ThemeToggle checked={false} onCheckedChange={onCheckedChange} />,
    );

    fireEvent.click(getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalled();
  });
});
