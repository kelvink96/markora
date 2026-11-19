import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import type { AppCommand } from "../../../features/commands/palette-commands";
import { collectCommandIds, MENU_LAYOUT, type MenuNode } from "../../../features/commands/menu-layout";
import { COMMAND_ICONS, SUBMENU_ICONS } from "./command-icons";

const ICON_CLASS = "size-4";

export interface RecentFile {
  documentId: string;
  projectId: string;
  title: string;
}

interface AppMenusProps {
  commands: AppCommand[];
  recentFiles: RecentFile[];
  onOpenRecent: (projectId: string, documentId: string) => void;
}

/** The File, Edit, Format, View and Help menus, laid out by MENU_LAYOUT from the shared command list. */
export function AppMenus({ commands, recentFiles, onOpenRecent }: AppMenusProps) {
  const byId = new Map(commands.map((command) => [command.id, command]));

  const renderCommand = (node: Extract<MenuNode, { type: "command" }>, inRadioGroup: boolean): ReactNode => {
    const command = byId.get(node.id);
    if (!command) return null;

    const Icon = COMMAND_ICONS[command.id];
    const content = (
      <>
        {Icon ? <Icon className={ICON_CLASS} /> : null}
        {node.label ?? command.label}
        {command.shortcut ? (
          <>
            {/* The space keeps the accessible name readable: "New Ctrl+N", not "NewCtrl+N". */}{" "}
            <MenubarShortcut>{command.shortcut}</MenubarShortcut>
          </>
        ) : null}
      </>
    );

    if (command.checked === undefined) {
      return (
        <MenubarItem key={command.id} disabled={!command.enabled} onSelect={() => command.run()}>
          {content}
        </MenubarItem>
      );
    }
    if (inRadioGroup) {
      return (
        <MenubarRadioItem key={command.id} value={command.id} disabled={!command.enabled} onSelect={() => command.run()}>
          {content}
        </MenubarRadioItem>
      );
    }
    return (
      <MenubarCheckboxItem key={command.id} checked={command.checked} disabled={!command.enabled} onSelect={() => command.run()}>
        {content}
      </MenubarCheckboxItem>
    );
  };

  const renderNodes = (nodes: MenuNode[], inRadioGroup = false): ReactNode =>
    nodes.map((node, index) => {
      switch (node.type) {
        case "separator":
          return <MenubarSeparator key={`separator-${index}`} />;
        case "command":
          return renderCommand(node, inRadioGroup);
        case "recent":
          return (
            <MenubarSub key="recent">
              <MenubarSubTrigger>
                <Clock className={ICON_CLASS} /> Open Recent
              </MenubarSubTrigger>
              <MenubarSubContent>
                {recentFiles.length > 0 ? (
                  recentFiles.map((entry) => (
                    <MenubarItem
                      key={`${entry.projectId}:${entry.documentId}`}
                      onSelect={() => onOpenRecent(entry.projectId, entry.documentId)}
                    >
                      {entry.title}
                    </MenubarItem>
                  ))
                ) : (
                  <MenubarItem disabled>No recent files</MenubarItem>
                )}
              </MenubarSubContent>
            </MenubarSub>
          );
        case "submenu":
          return renderSubmenu(node);
      }
    });

  const renderSubmenu = (node: Extract<MenuNode, { type: "submenu" }>): ReactNode => {
    const members = collectCommandIds(node.items).map((id) => byId.get(id));
    // A submenu whose members are all on/off commands is a "pick one" list (view mode, theme, colour scheme).
    const isPickOne = node.items.every((item) => item.type === "command") && members.every((member) => member?.checked !== undefined);
    const Icon = SUBMENU_ICONS[node.label];

    return (
      <MenubarSub key={node.label}>
        <MenubarSubTrigger disabled={members.every((member) => !member?.enabled)}>
          {Icon ? <Icon className={ICON_CLASS} /> : null} {node.label}
        </MenubarSubTrigger>
        <MenubarSubContent>
          {isPickOne ? (
            <MenubarRadioGroup value={members.find((member) => member?.checked)?.id ?? ""}>
              {renderNodes(node.items, true)}
            </MenubarRadioGroup>
          ) : (
            renderNodes(node.items)
          )}
        </MenubarSubContent>
      </MenubarSub>
    );
  };

  return (
    <>
      {MENU_LAYOUT.map((menu) => (
        <MenubarMenu key={menu.id}>
          <MenubarTrigger>{menu.label}</MenubarTrigger>
          <MenubarContent className="min-w-60">{renderNodes(menu.items)}</MenubarContent>
        </MenubarMenu>
      ))}
    </>
  );
}
