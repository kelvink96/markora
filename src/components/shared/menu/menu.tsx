import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
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
        className={`rounded-app-sm px-2 py-1 text-sm font-medium text-app-text transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-[color:var(--accent)] ${className ?? ""}`}
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
        className={`app-flyout-solid z-50 w-56 p-1.5 ${className ?? ""}`}
        sideOffset={8}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuSeparator() {
  return (
    <DropdownMenu.Separator
      className="my-1.5 h-px border-0 bg-[color:color-mix(in_srgb,var(--glass-border)_85%,transparent)]"
    />
  );
}

interface MenuSubItemProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function MenuSubItem({ label, icon, children }: MenuSubItemProps) {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger asChild>
        <button
          className="w-full rounded-app-sm px-2 py-1.5 text-left text-sm text-app-text transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] focus-visible:outline-none focus-visible:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))]"
          type="button"
        >
          <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="flex min-w-0 items-center gap-2">
              {icon ? <span aria-hidden="true" className="shrink-0 text-app-text-muted">{icon}</span> : null}
              <span className="truncate">{label}</span>
            </span>
            <ChevronRight className="size-4 text-app-text-muted" aria-hidden="true" />
          </span>
        </button>
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          className="app-flyout-solid z-50 w-56 p-1.5"
          sideOffset={4}
          alignOffset={-6}
        >
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

interface MenuItemProps {
  children: string;
  disabled?: boolean;
  icon?: ReactNode;
  onSelect?: () => void;
  shortcut?: string;
}

export function MenuItem({ children, disabled, icon, onSelect, shortcut }: MenuItemProps) {
  return (
    <DropdownMenu.Item asChild disabled={disabled}>
      <button
        className="w-full rounded-app-sm px-2 py-1.5 text-left text-sm text-app-text transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] focus-visible:outline-none focus-visible:bg-[color:color-mix(in_srgb,var(--glass-panel-strong)_65%,var(--surface-subtle))] data-[disabled]:cursor-not-allowed data-[disabled]:text-app-text-muted data-[disabled]:hover:bg-transparent"
        type="button"
        onClick={onSelect}
      >
        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <span className="flex min-w-0 items-center gap-2">
            {icon ? <span aria-hidden="true" className="shrink-0 text-app-text-muted">{icon}</span> : null}
            <span className="truncate">{children}</span>
          </span>
          {shortcut ? (
            <span aria-hidden="true" className="whitespace-nowrap text-[0.7rem] text-app-text-muted">
              {shortcut}
            </span>
          ) : null}
        </span>
      </button>
    </DropdownMenu.Item>
  );
}
