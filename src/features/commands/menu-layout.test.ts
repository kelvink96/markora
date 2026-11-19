import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../settings/settings-schema";
import { buildAppCommands, type PaletteContext, type PaletteHandlers } from "./palette-commands";
import { collectCommandIds, MENU_LAYOUT, type MenuNode } from "./menu-layout";

function allCommandIds() {
  const handlers = new Proxy({}, { get: () => vi.fn() }) as PaletteHandlers;
  const context: PaletteContext = {
    modifier: "Ctrl",
    hasActiveDocument: true,
    viewMode: "live",
    showOutline: false,
    appearance: { ...defaultSettings.appearance },
    editor: { ...defaultSettings.editor },
    handlers,
  };
  return new Set(buildAppCommands(context).map((command) => command.id));
}

/** Every node at every level of one menu, in order, so separators can be checked in each submenu too. */
function lists(nodes: MenuNode[]): MenuNode[][] {
  return [nodes, ...nodes.flatMap((node) => (node.type === "submenu" ? lists(node.items) : []))];
}

describe("MENU_LAYOUT", () => {
  it("has File, Edit, Format, View and Help in that order", () => {
    expect(MENU_LAYOUT.map((menu) => menu.id)).toEqual(["file", "edit", "format", "view", "help"]);
    expect(MENU_LAYOUT.map((menu) => menu.label)).toEqual(["File", "Edit", "Format", "View", "Help"]);
  });

  it("only refers to commands that exist", () => {
    const known = allCommandIds();
    const missing = MENU_LAYOUT.flatMap((menu) => collectCommandIds(menu.items)).filter((id) => !known.has(id));

    expect(missing).toEqual([]);
  });

  it("lists each command once across all the menus", () => {
    const ids = MENU_LAYOUT.flatMap((menu) => collectCommandIds(menu.items));

    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("never starts or ends a list with a separator or puts two together", () => {
    for (const menu of MENU_LAYOUT) {
      for (const items of lists(menu.items)) {
        const types = items.map((node) => node.type);
        expect(types[0], menu.id).not.toBe("separator");
        expect(types[types.length - 1], menu.id).not.toBe("separator");
        expect(types.join(",")).not.toContain("separator,separator");
      }
    }
  });

  it("puts Open Recent in the File menu", () => {
    expect(MENU_LAYOUT[0].items.some((node) => node.type === "recent")).toBe(true);
  });

  it("shortens option labels inside the Theme and Color Scheme submenus", () => {
    const view = MENU_LAYOUT.find((menu) => menu.id === "view");
    const submenu = (label: string) => view?.items.find((node) => node.type === "submenu" && node.label === label);
    const labels = (node: MenuNode | undefined) =>
      node?.type === "submenu" ? node.items.map((item) => (item.type === "command" ? item.label : null)) : [];

    expect(labels(submenu("Theme"))).toEqual(["System", "Light", "Dark"]);
    expect(labels(submenu("Color Scheme"))).toEqual(["Standard", "Sepia", "High Contrast"]);
  });
});

describe("collectCommandIds", () => {
  it("finds commands inside nested submenus and skips separators and Open Recent", () => {
    const nodes: MenuNode[] = [
      { type: "command", id: "a" },
      { type: "separator" },
      { type: "recent" },
      { type: "submenu", label: "More", items: [{ type: "command", id: "b" }, { type: "submenu", label: "Deeper", items: [{ type: "command", id: "c" }] }] },
    ];

    expect(collectCommandIds(nodes)).toEqual(["a", "b", "c"]);
  });
});
