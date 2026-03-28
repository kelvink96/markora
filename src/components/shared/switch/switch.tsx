import * as RadixSwitch from "@radix-ui/react-switch";
import { useState } from "react";

interface SwitchProps {
  checked?: boolean;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked,
  className,
  defaultChecked = false,
  disabled = false,
  label,
  onCheckedChange,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const resolvedChecked = isControlled ? checked : internalChecked;

  return (
    <label className="inline-flex items-center gap-3 text-sm text-app-text">
      <RadixSwitch.Root
        checked={resolvedChecked}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] transition-[background-color,border-color,box-shadow] data-[state=checked]:bg-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
        disabled={disabled}
        onCheckedChange={(nextChecked) => {
          if (!isControlled) {
            setInternalChecked(nextChecked);
          }
          onCheckedChange?.(nextChecked);
        }}
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[1.25rem]" />
      </RadixSwitch.Root>
      <span>{label}</span>
    </label>
  );
}
