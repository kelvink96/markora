import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaSelected?: boolean;
  isActive?: boolean;
}

export function Tab({
  ariaSelected = false,
  children,
  className,
  isActive = false,
  type = "button",
  ...props
}: PropsWithChildren<TabProps>) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={ariaSelected}
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-app-sm border px-3.5 py-2 text-[0.82rem] transition-[background-color,border-color,color,box-shadow,transform] ${
        isActive
          ? "border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] text-app-text"
          : "border-transparent bg-[color:var(--glass-panel)] text-app-text-secondary hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] hover:text-app-text"
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
