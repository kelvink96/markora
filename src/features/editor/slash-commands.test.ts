import { describe, expect, it } from "vitest";
import {
  applySlashCommand,
  getSlashCommandContext,
  matchSlashCommands,
} from "./slash-commands";

describe("slash commands", () => {
  it("finds a slash token anywhere in the current text", () => {
    const context = getSlashCommandContext("Hello /ta world", 9);

    expect(context).toMatchObject({
      query: "ta",
      from: 6,
      to: 9,
    });
  });

  it("does not trigger inside a url", () => {
    const context = getSlashCommandContext("Visit https://markora.app", 14);

    expect(context).toBeNull();
  });

  it("does not trigger inside a fenced code block", () => {
    const context = getSlashCommandContext("```md\n/table\n```", 11);

    expect(context).toBeNull();
  });

  it("matches commands by alias and label", () => {
    const commands = matchSlashCommands("ta");

    expect(commands.map((command) => command.id)).toContain("table");
    expect(commands.map((command) => command.id)).toContain("taskList");
  });

  it("replaces the typed slash token with the selected markdown insertion", () => {
    const result = applySlashCommand("Start /table here", 6, 12, "table");

    expect(result.text).toContain("| Column | Value |");
    expect(result.text).not.toContain("/table");
    expect(result.selectionStart).toBe(6);
  });
});
