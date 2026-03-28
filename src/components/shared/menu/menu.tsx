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
        className={`rounded-app-sm border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-panel)] px-3 py-1.5 text-[0.95rem] font-medium text-app-text backdrop-blur-[var(--glass-blur-soft)] transition-[background-color,border-color,color,box-shadow] hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 ${className ?? ""}`}
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
        className={`z-50 min-w-48 rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] p-2 shadow-[0_18px_40px_rgba(30,43,52,0.12)] backdrop-blur-[var(--glass-blur-soft)] ${className ?? ""}`}
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
        className="w-full rounded-app-sm px-3 py-2 text-left text-app-text transition-[background-color,color] hover:bg-[color:var(--glass-hover)] focus-visible:outline-none focus-visible:bg-[color:var(--glass-hover)] data-[disabled]:cursor-not-allowed data-[disabled]:text-app-text-muted data-[disabled]:hover:bg-transparent"
        type="button"
        onClick={onSelect}
      >
        {children}
      </button>
    </DropdownMenu.Item>
  );
}
