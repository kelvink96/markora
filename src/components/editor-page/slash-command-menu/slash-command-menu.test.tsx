import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SlashCommandMenu, slashOptionId } from "./slash-command-menu";

describe("SlashCommandMenu", () => {
  it("renders available slash commands with descriptions", () => {
    render(
      <SlashCommandMenu
        commands={[
          { id: "table", label: "Table", description: "Insert a markdown table", aliases: ["tbl"] },
          { id: "taskList", label: "Task list", description: "Insert markdown tasks", aliases: ["todo"] },
        ]}
        selectedIndex={0}
        position={{ top: 16, left: 24 }}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("listbox", { name: "Slash commands" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /table/i })).toBeInTheDocument();
    expect(screen.getByText("Insert a markdown table")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked command", () => {
    const onSelect = vi.fn();

    render(
      <SlashCommandMenu
        commands={[
          { id: "table", label: "Table", description: "Insert a markdown table", aliases: ["tbl"] },
        ]}
        selectedIndex={0}
        position={{ top: 16, left: 24 }}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("option", { name: /table/i }));

    expect(onSelect).toHaveBeenCalledWith("table");
  });

  // The editor keeps focus and points at the highlighted option, so options are not Tab stops of their own.
  it("gives each option an id for the editor to point at, and keeps options out of the tab order", () => {
    render(
      <SlashCommandMenu
        id="slash"
        commands={[
          { id: "table", label: "Table", description: "Insert a markdown table", aliases: ["tbl"] },
          { id: "taskList", label: "Task list", description: "Insert markdown tasks", aliases: ["todo"] },
        ]}
        selectedIndex={1}
        position={{ top: 16, left: 24 }}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("listbox", { name: "Slash commands" })).toHaveAttribute("id", "slash");
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.id)).toEqual([slashOptionId("slash", 0), slashOptionId("slash", 1)]);
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("Task list");
    for (const option of options) {
      expect(option.tagName).not.toBe("BUTTON");
      expect(option).not.toHaveAttribute("tabindex");
    }
  });
});
