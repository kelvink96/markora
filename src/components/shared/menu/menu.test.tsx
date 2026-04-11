import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuContent, MenuItem, MenuTrigger } from "./menu";

describe("Menu", () => {
  it("renders reusable trigger and content primitives", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu.Root>
        <MenuTrigger>Open</MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={() => {}}>Rename</MenuItem>
        </MenuContent>
      </DropdownMenu.Root>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    expect(trigger).toHaveClass("rounded-app-md");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
  });

  it("uses a solid menu background token for trigger surfaces", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu.Root>
        <MenuTrigger>File</MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={() => {}}>Open</MenuItem>
        </MenuContent>
      </DropdownMenu.Root>,
    );

    const trigger = screen.getByRole("button", { name: "File" });
    await user.click(trigger);

    expect(trigger).toHaveClass("bg-[color:var(--surface-menu)]");
    expect(screen.getByRole("menu")).toHaveClass("app-flyout-solid");
  });
});
