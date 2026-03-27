import * as Tooltip from "@radix-ui/react-tooltip";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({
  label,
  children,
  ...props
}: PropsWithChildren<IconButtonProps>) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-app-md border border-transparent bg-app-panel-strong px-3 py-2 text-app-text transition hover:border-black/10 hover:bg-app-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={label}
            {...props}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-app-md border border-black/10 bg-app-panel-strong px-2 py-1 text-sm text-app-text shadow-[0_18px_40px_rgba(30,43,52,0.07)]"
            sideOffset={8}
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
