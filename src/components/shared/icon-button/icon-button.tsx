import * as Tooltip from "@radix-ui/react-tooltip";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: PropsWithChildren<IconButtonProps>) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-app-md border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-panel)] px-3 py-2 text-app-text backdrop-blur-[var(--glass-blur-soft)] transition hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
            aria-label={label}
            {...props}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-app-md border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-2 py-1 text-sm text-app-text shadow-[0_18px_40px_rgba(30,43,52,0.12)] backdrop-blur-[var(--glass-blur-soft)]"
            sideOffset={8}
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
