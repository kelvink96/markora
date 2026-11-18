import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./command-palette";
import type { PaletteCommand } from "../../../features/commands/palette-commands";

function commands(): PaletteCommand[] {
  return [
    { id: "file.new", label: "New document", group: "File", shortcut: "Ctrl+N", run: vi.fn() },
    { id: "format.bold", label: "Bold", group: "Format", keywords: ["strong"], run: vi.fn() },
    { id: "view.theme", label: "Toggle light/dark theme", group: "View", keywords: ["dark mode"], run: vi.fn() },
  ];
}

describe("CommandPalette", () => {
  it("renders nothing while closed", () => {
    render(<CommandPalette open={false} onOpenChange={() => {}} commands={commands()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists commands under their group with their shortcut", () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands()} />);

    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /New document/ })).toBeInTheDocument();
    expect(screen.getByText("Ctrl+N")).toBeInTheDocument();
    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("filters by label and by keyword", async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onOpenChange={() => {}} commands={commands()} />);

    await user.type(screen.getByPlaceholderText("Type a command..."), "strong");

    expect(screen.getByRole("option", { name: /Bold/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /New document/ })).not.toBeInTheDocument();
  });

  it("does not fuzzy-match scattered letters, so Enter cannot hit a destructive command", async () => {
    const user = userEvent.setup();
    const list = [...commands(), { id: "file.close", label: "Close tab", group: "File" as const, keywords: ["close document"], run: vi.fn() }];
    render(<CommandPalette open onOpenChange={() => {}} commands={list} />);

    await user.type(screen.getByPlaceholderText("Type a command..."), "bold");

    expect(screen.getByRole("option", { name: /Bold/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("option", { name: /Close tab/ })).not.toBeInTheDocument();
  });

  it("says so when nothing matches", async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onOpenChange={() => {}} commands={commands()} />);

    await user.type(screen.getByPlaceholderText("Type a command..."), "zzzzzz");

    expect(screen.getByText("No matching commands.")).toBeInTheDocument();
  });

  it("runs the highlighted command on Enter and closes", async () => {
    const user = userEvent.setup();
    const list = commands();
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} commands={list} />);

    await user.type(screen.getByPlaceholderText("Type a command..."), "bold");
    await user.keyboard("{Enter}");

    expect(list[1].run).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("runs a command when it is clicked", async () => {
    const user = userEvent.setup();
    const list = commands();
    render(<CommandPalette open onOpenChange={() => {}} commands={list} />);

    await user.click(screen.getByRole("option", { name: /New document/ }));

    expect(list[0].run).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape without running anything", async () => {
    const user = userEvent.setup();
    const list = commands();
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} commands={list} />);

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(list.every((command) => vi.mocked(command.run).mock.calls.length === 0)).toBe(true);
  });
});
