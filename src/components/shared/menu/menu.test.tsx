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

    expect(trigger).toHaveClass("rounded-app-sm");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
  });
});
