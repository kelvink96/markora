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

    const trigger = screen.getByRole("button", { name: "File" });
    await user.click(trigger);

    expect(trigger).toHaveClass(
      "menu-bar__trigger",
      "rounded-app-md",
      "shadow-[var(--shadow-crisp)]",
    );
    expect(screen.getByRole("menuitem", { name: "New" })).toBeInTheDocument();
    expect(screen.getByRole("menu")).toHaveClass(
      "menu-bar__content",
      "app-flyout",
    );
  });
});
