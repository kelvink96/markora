import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Exclude<ButtonSize, "icon">;
}

const baseClassName =
  "inline-flex items-center justify-center rounded-app-sm border text-app-text transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "border-app-accent/70 bg-app-accent text-white shadow-[var(--shadow-crisp)] hover:border-app-accent hover:bg-app-accent/90",
  secondary:
    "border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] backdrop-blur-[var(--glass-blur-soft)] hover:bg-[color:var(--glass-hover)]",
  ghost:
    "border-transparent bg-transparent hover:bg-[color:var(--glass-hover)]",
  danger:
    "border-red-300/70 bg-red-50/85 text-red-700 backdrop-blur-[var(--glass-blur-soft)] hover:bg-red-100/90",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-10 px-3 py-2 text-sm",
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
      {children}
    </button>
  );
}
