import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("renders an accessible button with its label", () => {
    render(<IconButton label="Save">S</IconButton>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
