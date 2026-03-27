import {
  applyMarkdownToolbarAction,
  type MarkdownEditResult,
  type MarkdownToolbarAction,
} from "./markdown-toolbar-actions";

export interface SlashCommandDefinition {
  id: MarkdownToolbarAction;
  label: string;
  description: string;
  aliases: string[];
}

export interface SlashCommandContext {
  query: string;
  from: number;
  to: number;
}

const slashCommands: SlashCommandDefinition[] = [
  {
    id: "heading",
    label: "Heading",
    description: "Insert a level-one heading",
    aliases: ["h1", "heading", "title"],
  },
  {
    id: "bold",
    label: "Bold",
    description: "Wrap the selection in bold markdown",
    aliases: ["b", "bold"],
  },
  {
    id: "italic",
    label: "Italic",
    description: "Wrap the selection in italic markdown",
    aliases: ["i", "italic"],
  },
  {
    id: "strike",
    label: "Strikethrough",
    description: "Wrap the selection in strikethrough markdown",
    aliases: ["strike", "strikethrough"],
  },
  {
    id: "bulletList",
    label: "Bullet list",
    description: "Start a bulleted list",
    aliases: ["bullet", "bullets", "ul", "list"],
  },
  {
    id: "orderedList",
    label: "Numbered list",
    description: "Start a numbered list",
    aliases: ["ordered", "numbered", "ol"],
  },
  {
    id: "taskList",
    label: "Task list",
    description: "Insert markdown task items",
    aliases: ["task", "todo", "checklist"],
  },
  {
    id: "quote",
    label: "Quote",
    description: "Insert a blockquote",
    aliases: ["quote", "blockquote"],
  },
  {
    id: "codeBlock",
    label: "Code block",
    description: "Insert a fenced code block",
    aliases: ["code", "snippet", "fence"],
  },
  {
    id: "link",
    label: "Link",
    description: "Insert a markdown link",
    aliases: ["link", "url"],
  },
  {
    id: "image",
    label: "Image",
    description: "Insert a markdown image",
    aliases: ["image", "img", "media"],
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a markdown table",
    aliases: ["table", "tbl"],
  },
];

function isInsideCodeFence(text: string, cursor: number) {
  const beforeCursor = text.slice(0, cursor);
  const fenceMatches = beforeCursor.match(/```/g);
  return (fenceMatches?.length ?? 0) % 2 === 1;
}

function isUrlLike(text: string, slashIndex: number) {
  const prefix = text.slice(Math.max(0, slashIndex - 8), slashIndex + 1);
  return prefix.includes("://") || prefix.endsWith("//");
}

export function getSlashCommandContext(
  text: string,
  cursor: number,
): SlashCommandContext | null {
  if (isInsideCodeFence(text, cursor)) {
    return null;
  }

  const beforeCursor = text.slice(0, cursor);
  const slashIndex = beforeCursor.lastIndexOf("/");
  if (slashIndex === -1) {
    return null;
  }

  if (isUrlLike(text, slashIndex)) {
    return null;
  }

  const query = text.slice(slashIndex + 1, cursor);
  if (/\s/.test(query)) {
    return null;
  }

  return {
    query,
    from: slashIndex,
    to: cursor,
  };
}

export function matchSlashCommands(query: string): SlashCommandDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return slashCommands;
  }

  return slashCommands.filter((command) => {
    const haystack = [command.label, ...command.aliases].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function applySlashCommand(
  text: string,
  from: number,
  to: number,
  commandId: MarkdownToolbarAction,
): MarkdownEditResult {
  const textWithoutToken = `${text.slice(0, from)}${text.slice(to)}`;
  return applyMarkdownToolbarAction(textWithoutToken, from, from, commandId);
}
