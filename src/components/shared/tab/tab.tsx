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
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-app-sm border px-3.5 py-2 text-[0.82rem] transition-[background-color,border-color,color,box-shadow,transform] ${
        isActive
          ? "border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] text-app-text"
          : "border-transparent bg-[color:var(--glass-panel)] text-app-text-secondary hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] hover:text-app-text"
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
