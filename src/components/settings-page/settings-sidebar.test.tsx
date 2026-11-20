import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsSidebar } from "./settings-sidebar";

describe("SettingsSidebar", () => {
  // The jump list scrolls within one page, so the current entry is a location, not a page.
  it("marks the section in view as the current location", () => {
    render(<SettingsSidebar activeSection="writing" showJumpList onClose={() => {}} onJump={() => {}} />);

    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    const current = nav.querySelector("[aria-current]");
    expect(current).toHaveAttribute("aria-current", "location");
    expect(current).toHaveTextContent("Writing");
  });

  it("builds the jump list from the app's Button", () => {
    render(<SettingsSidebar activeSection="writing" showJumpList onClose={() => {}} onJump={() => {}} />);

    for (const button of screen.getAllByRole("button").slice(0, -1)) {
      expect(button).toHaveAttribute("data-slot", "button");
    }
  });
});
