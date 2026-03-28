import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("renders an accessible button with its label", () => {
    render(<IconButton label="Save">S</IconButton>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("supports the shared visual variants", () => {
    render(
      <>
        <IconButton label="Settings" variant="ghost">
          S
        </IconButton>
        <IconButton label="Delete" variant="danger">
          D
        </IconButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toHaveClass("bg-transparent");
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("text-red-700");
  });
});
