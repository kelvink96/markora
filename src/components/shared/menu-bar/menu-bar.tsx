import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

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
          <DropdownMenu.Trigger asChild>
            <button
              className="menu-bar__trigger rounded-app-sm border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-panel)] px-3 py-1.5 text-[0.95rem] font-medium text-app-text backdrop-blur-[var(--glass-blur-soft)] transition hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40"
              type="button"
            >
              {group.label}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="menu-bar__content z-50 min-w-48 rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] p-2 shadow-[0_18px_40px_rgba(30,43,52,0.12)] backdrop-blur-[var(--glass-blur-soft)]"
              sideOffset={8}
            >
              {group.items.map((item) => (
                <DropdownMenu.Item key={item.label} asChild disabled={item.disabled}>
                  <button
                    className="w-full rounded-app-sm px-3 py-2 text-left text-app-text transition hover:bg-[color:var(--glass-hover)] focus-visible:outline-none focus-visible:bg-[color:var(--glass-hover)] data-[disabled]:cursor-not-allowed data-[disabled]:text-app-text-muted data-[disabled]:hover:bg-transparent"
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
