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
    <nav className="inline-flex items-center gap-1" aria-label="Application menu">
      {groups.map((group) => (
        <DropdownMenu.Root key={group.label}>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded-[0.65rem] bg-transparent px-3 py-2 text-app-text transition hover:bg-app-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40"
              type="button"
            >
              {group.label}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-48 rounded-app-md border border-black/10 bg-app-panel-strong p-2 shadow-[0_18px_40px_rgba(30,43,52,0.07)]"
              sideOffset={8}
            >
              {group.items.map((item) => (
                <DropdownMenu.Item key={item.label} asChild disabled={item.disabled}>
                  <button
                    className="w-full rounded-app-sm px-3 py-2 text-left text-app-text transition hover:bg-app-subtle focus-visible:outline-none focus-visible:bg-app-subtle data-[disabled]:cursor-not-allowed data-[disabled]:text-app-text-muted data-[disabled]:hover:bg-transparent"
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
