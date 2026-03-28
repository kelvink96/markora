import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "../menu";

export interface MenuBarItem {
  type?: "item" | "separator";
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  shortcut?: string;
  icon?: ReactNode;
}

export interface MenuBarGroup {
  label: string;
  items: MenuBarItem[];
}

interface MenuBarProps {
  groups: MenuBarGroup[];
}

export function MenuBar({ groups }: MenuBarProps) {
  return (
    <nav className="inline-flex items-center gap-0.5" aria-label="Application menu">
      {groups.map((group) => (
        <DropdownMenu.Root key={group.label}>
          <MenuTrigger className="menu-bar__trigger">{group.label}</MenuTrigger>
          <MenuContent className="menu-bar__content">
            {group.items.map((item, index) =>
              item.type === "separator" ? (
                <MenuSeparator key={`${group.label}-separator-${index}`} />
              ) : (
                <MenuItem
                  key={item.label}
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                  shortcut={item.shortcut}
                  icon={item.icon}
                >
                  {item.label}
                </MenuItem>
              ),
            )}
          </MenuContent>
        </DropdownMenu.Root>
      ))}
    </nav>
  );
}
