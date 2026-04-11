import * as Tooltip from "@radix-ui/react-tooltip";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { getButtonClassName, type ButtonVariant } from "../button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({
  label,
  children,
  className,
  variant = "secondary",
  ...props
}: PropsWithChildren<IconButtonProps>) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className={getButtonClassName({
              variant,
              size: "icon",
              className,
            })}
            aria-label={label}
            type="button"
            {...props}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="app-flyout-solid z-50 px-2 py-1 text-sm text-app-text"
            sideOffset={8}
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
