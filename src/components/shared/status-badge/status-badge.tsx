import type { HTMLAttributes, PropsWithChildren } from "react";

type StatusBadgeTone = "default" | "muted" | "success" | "warning";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
}

const toneClassNames: Record<StatusBadgeTone, string> = {
  default: "border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] text-app-text",
  muted: "border-[color:color-mix(in_srgb,var(--glass-border)_55%,transparent)] text-app-text-muted",
  success: "border-[color:color-mix(in_srgb,var(--success)_35%,var(--glass-border-strong))] text-app-text-secondary",
  warning: "border-[color:color-mix(in_srgb,#c28a2a_35%,var(--glass-border-strong))] text-app-text-secondary",
};

export function StatusBadge({
  children,
  className,
  tone = "default",
  ...props
}: PropsWithChildren<StatusBadgeProps>) {
  return (
    <span
      className={`app-chip px-2.5 py-1.5 text-[0.78rem] uppercase tracking-[0.12em] ${toneClassNames[tone]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
