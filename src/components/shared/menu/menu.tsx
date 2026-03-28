import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function MenuTrigger({
  children,
  className,
  type = "button",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <DropdownMenu.Trigger asChild>
      <button
        className={`rounded-app-md border border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--surface-panel)_92%,var(--surface-panel-strong))] px-3 py-1.5 text-[0.95rem] font-medium text-app-text shadow-[var(--shadow-crisp)] transition-[background-color,border-color,color,box-shadow] duration-150 ease-out hover:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_96%,var(--surface-panel-strong))] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--shadow-crisp),0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] ${className ?? ""}`}
        type={type}
        {...props}
      >
        {children}
      </button>
    </DropdownMenu.Trigger>
  );
}

interface MenuContentProps {
  children: ReactNode;
  className?: string;
}

export function MenuContent({ children, className }: MenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className={`app-flyout z-50 min-w-48 p-2 ${className ?? ""}`}
        sideOffset={8}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

interface MenuItemProps {
  children: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export function MenuItem({ children, disabled, onSelect }: MenuItemProps) {
  return (
    <DropdownMenu.Item asChild disabled={disabled}>
      <button
        className="w-full rounded-app-sm border border-transparent px-3 py-2 text-left text-app-text transition-[background-color,border-color,color] duration-150 ease-out hover:border-[color:color-mix(in_srgb,var(--glass-border)_65%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_96%,var(--surface-panel-strong))] focus-visible:outline-none focus-visible:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] focus-visible:bg-[color:color-mix(in_srgb,var(--surface-panel)_96%,var(--surface-panel-strong))] data-[disabled]:cursor-not-allowed data-[disabled]:text-app-text-muted data-[disabled]:hover:border-transparent data-[disabled]:hover:bg-transparent"
        type="button"
        onClick={onSelect}
      >
        {children}
      </button>
    </DropdownMenu.Item>
  );
}
