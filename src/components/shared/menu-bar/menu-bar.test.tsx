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
      "w-56",
    );
  });

  it("renders a visible shortcut hint without changing the menu item name", async () => {
    const user = userEvent.setup();

    render(
      <MenuBar
        groups={[
          {
            label: "File",
            items: [{ label: "Save", shortcut: "Ctrl+S", onSelect: vi.fn() }],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "File" }));

    expect(screen.getByRole("menuitem", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
  });

  it("renders a leading icon for menu items when provided", async () => {
    const user = userEvent.setup();

    render(
      <MenuBar
        groups={[
          {
            label: "Help",
            items: [
              {
                label: "About Markora",
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 16 16">
                    <path d="M1 1h14v14H1z" />
                  </svg>
                ),
                onSelect: vi.fn(),
              },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Help" }));

    expect(screen.getByRole("menuitem", { name: "About Markora" }).querySelector("svg")).not.toBeNull();
  });
});
