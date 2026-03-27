import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import "./menu-bar.css";

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
    <nav className="menu-bar" aria-label="Application menu">
      {groups.map((group) => (
        <DropdownMenu.Root key={group.label}>
          <DropdownMenu.Trigger asChild>
            <button className="menu-bar__trigger" type="button">
              {group.label}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="menu-bar__content" sideOffset={8}>
              {group.items.map((item) => (
                <DropdownMenu.Item key={item.label} asChild disabled={item.disabled}>
                  <button
                    className="menu-bar__item"
                    type="button"
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </button>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ))}
    </nav>
  );
}
