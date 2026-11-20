/**
 * How the menu bar arranges the app's commands. Pure data: each entry names a command from
 * `buildAppCommands` by id, so labels, shortcuts and enabled state come from one place.
 */
export type MenuNode =
  /** A command by id. `label` shortens it inside a submenu ("Theme: Dark" shows as "Dark" under Theme). */
  | { type: "command"; id: string; label?: string }
  | { type: "separator" }
  | { type: "submenu"; label: string; items: MenuNode[] }
  /** The Open Recent submenu, built from the recent documents rather than from a command. */
  | { type: "recent" };

export interface MenuDefinition {
  id: "file" | "edit" | "format" | "view" | "help";
  label: string;
  items: MenuNode[];
}

const command = (id: string, label?: string): MenuNode => ({ type: "command", id, label });
const separator: MenuNode = { type: "separator" };
const submenu = (label: string, items: MenuNode[]): MenuNode => ({ type: "submenu", label, items });

export const MENU_LAYOUT: MenuDefinition[] = [
  {
    id: "file",
    label: "File",
    items: [
      command("file.new"),
      command("file.open"),
      { type: "recent" },
      separator,
      command("file.save"),
      command("file.save-as"),
      submenu("Export", [command("file.export-html", "HTML"), command("file.export-pdf", "PDF")]),
      separator,
      command("file.close"),
      separator,
      command("app.settings"),
    ],
  },
  {
    id: "edit",
    label: "Edit",
    items: [
      command("edit.undo"),
      command("edit.redo"),
      separator,
      command("edit.cut"),
      command("edit.copy"),
      command("edit.paste"),
      command("edit.select-all"),
      separator,
      command("edit.find"),
      command("edit.replace"),
    ],
  },
  {
    id: "format",
    label: "Format",
    items: [
      command("format.bold"),
      command("format.italic"),
      command("format.strikethrough"),
      command("format.link"),
      separator,
      command("format.heading"),
      submenu("List", [command("format.bulletList"), command("format.orderedList"), command("format.taskList")]),
      command("format.quote"),
      command("format.codeBlock"),
      command("format.table"),
      command("format.image"),
    ],
  },
  {
    id: "view",
    label: "View",
    items: [
      submenu("Mode", [
        command("view.mode.write"),
        command("view.mode.split"),
        command("view.mode.read"),
      ]),
      command("view.syntax"),
      command("view.focus"),
      separator,
      command("view.outline"),
      command("view.status-bar"),
      separator,
      submenu("Theme", [
        command("view.theme.system", "System"),
        command("view.theme.light", "Light"),
        command("view.theme.dark", "Dark"),
      ]),
      submenu("Color Scheme", [
        command("view.color-scheme.standard", "Standard"),
        command("view.color-scheme.sepia", "Sepia"),
        command("view.color-scheme.high-contrast", "High Contrast"),
      ]),
      separator,
      command("view.word-wrap"),
      command("view.line-numbers"),
      separator,
      command("view.zoom-in"),
      command("view.zoom-out"),
      command("view.zoom-reset"),
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      command("app.palette"),
      command("help.tour"),
      command("help.shortcuts"),
      command("help.release-notes"),
      command("help.check-for-updates"),
      separator,
      command("help.docs"),
      command("help.report-issue"),
      separator,
      command("help.about"),
    ],
  },
];

/** The ids of every command in `nodes`, including those inside submenus, in menu order. */
export function collectCommandIds(nodes: MenuNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "command") return [node.id];
    if (node.type === "submenu") return collectCommandIds(node.items);
    return [];
  });
}
