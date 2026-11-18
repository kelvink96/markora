import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Select, SelectTrigger, SelectValue } from "./select";
import { Switch } from "./switch";
import { Toggle } from "./toggle";
import { Menubar, MenubarMenu, MenubarTrigger } from "./menubar";

// jsdom can't measure layout, so check the class that makes each control grow to a 44px hit area on
// touch screens (@media (pointer: coarse)). The real-browser measurements are in the PR description.
const COARSE = "pointer-coarse:";

describe("touch targets (#8)", () => {
  it.each(["default", "sm", "lg", "icon", "icon-sm", "icon-lg", "xs", "icon-xs"] as const)(
    "Button size %s grows on touch screens",
    (size) => {
      render(<Button size={size}>Go</Button>);

      expect(screen.getByRole("button").className).toContain(COARSE);
    },
  );

  it("toggles grow on touch screens", () => {
    render(<Toggle aria-label="t">x</Toggle>);

    expect(screen.getByRole("button").className).toContain(`${COARSE}h-11`);
  });

  it("select triggers grow on touch screens", () => {
    render(
      <Select>
        <SelectTrigger aria-label="s">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );

    expect(screen.getByRole("combobox").className).toContain(`${COARSE}data-[size=default]:h-11`);
  });

  it("switches stay visually small but get a larger tappable area on touch screens", () => {
    render(<Switch aria-label="sw" />);

    expect(screen.getByRole("switch").className).toContain(`${COARSE}before:-inset-y-3.5`);
  });

  it("menu bar triggers grow on touch screens", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );

    expect(screen.getByRole("menuitem", { name: "File" }).className).toContain(`${COARSE}py-3`);
    expect(screen.getByRole("menuitem", { name: "File" }).className).toContain(`${COARSE}px-3`);
  });
});
