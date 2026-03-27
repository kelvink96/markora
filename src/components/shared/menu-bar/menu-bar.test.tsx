import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuBar } from "./menu-bar";

describe("MenuBar", () => {
  it("renders a menu trigger and opens its items", async () => {
    const user = userEvent.setup();

    render(
      <MenuBar
        groups={[
          {
            label: "File",
            items: [{ label: "New", onSelect: vi.fn() }],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));

    expect(screen.getByRole("menuitem", { name: "New" })).toBeInTheDocument();
  });
});
