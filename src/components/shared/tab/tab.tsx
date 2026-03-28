import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  ariaSelected?: boolean;
  className?: string;
  isActive?: boolean;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
}

export function Tab({
  ariaSelected = false,
  children,
  className,
  isActive = false,
  leftSection,
  rightSection,
  type = "button",
  ...props
}: PropsWithChildren<TabProps>) {
  return (
    <div
      data-tab-item="true"
      className={`inline-flex min-w-0 items-center gap-2 rounded-app-md border px-3.5 py-2 text-[0.82rem] shadow-[var(--shadow-crisp)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ${
        isActive
          ? "border-[color:color-mix(in_srgb,var(--glass-border)_74%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))] text-app-text"
          : "border-[color:transparent] bg-[color:color-mix(in_srgb,var(--surface-panel)_90%,var(--surface-subtle))] text-app-text-secondary shadow-none hover:border-[color:color-mix(in_srgb,var(--glass-border)_66%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_94%,var(--surface-panel-strong))] hover:text-app-text"
      } ${className ?? ""}`}
    >
      {leftSection ? <span className="shrink-0">{leftSection}</span> : null}
      <button
        type={type}
        role="tab"
        aria-selected={ariaSelected}
        className="min-w-0 flex-1 truncate bg-transparent text-left focus-visible:outline-none"
        {...props}
      >
        <span className="min-w-0 truncate">{children}</span>
      </button>
      {rightSection ? <span className="shrink-0">{rightSection}</span> : null}
    </div>
  );
}
