import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MenuContent, MenuItem, MenuTrigger } from "../menu";

export interface MenuBarItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
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
            {group.items.map((item) => (
              <MenuItem key={item.label} disabled={item.disabled} onSelect={item.onSelect}>
                {item.label}
              </MenuItem>
            ))}
          </MenuContent>
        </DropdownMenu.Root>
      ))}
    </nav>
  );
}
