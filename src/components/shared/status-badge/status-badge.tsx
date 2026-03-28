import type { HTMLAttributes, PropsWithChildren } from "react";

type StatusBadgeTone = "default" | "muted" | "success" | "warning";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
}

const toneClassNames: Record<StatusBadgeTone, string> = {
  default: "text-app-text",
  muted: "text-app-text-muted",
  success: "text-app-text-secondary",
  warning: "text-app-text-secondary",
};

export function StatusBadge({
  children,
  className,
  tone = "default",
  ...props
}: PropsWithChildren<StatusBadgeProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1.5 text-[0.78rem] uppercase tracking-[0.12em] ${toneClassNames[tone]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
