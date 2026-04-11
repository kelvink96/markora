import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  variant?: ButtonVariant;
  size?: Exclude<ButtonSize, "icon">;
}

const baseClassName =
  "inline-flex items-center justify-center gap-2 rounded-app-md border text-app-text shadow-[var(--shadow-crisp)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:cursor-pointer focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--shadow-crisp),0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-60";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "border-[color:color-mix(in_srgb,var(--accent)_55%,var(--glass-border-strong))] bg-[color:var(--accent-strong)] text-app-text hover:border-[color:var(--accent-strong)] hover:brightness-[1.05]",
  secondary:
    "border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))] hover:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] hover:bg-[color:color-mix(in_srgb,var(--glass-elevated)_76%,var(--surface-panel-strong))]",
  ghost:
    "border-transparent bg-transparent shadow-none hover:border-[color:color-mix(in_srgb,var(--glass-border)_60%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_88%,var(--surface-subtle))]",
  danger:
    "border-red-400/45 bg-[color:color-mix(in_srgb,#f5d7d7_62%,var(--surface-panel-strong))] text-red-700 hover:border-red-500/55 hover:bg-[color:color-mix(in_srgb,#f1c6c6_72%,var(--surface-panel-strong))] dark:text-red-200",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-10 px-3.5 py-2.5 text-sm",
  icon: "size-10 min-h-10 min-w-10 p-0",
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getButtonClassName({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return joinClasses(baseClassName, variantClassNames[variant], sizeClassNames[size], className);
}

export function Button({
  children,
  className,
  leftSection,
  rightSection,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={getButtonClassName({ variant, size, className })}
      type={type}
      {...props}
    >
      {leftSection ? (
        <span aria-hidden="true" className="shrink-0">
          {leftSection}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
      {rightSection ? (
        <span aria-hidden="true" className="shrink-0">
          {rightSection}
        </span>
      ) : null}
    </button>
  );
}
