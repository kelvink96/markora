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
        data-testid="switch-track"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_82%,var(--surface-panel-strong))] p-[2px] shadow-[var(--shadow-crisp),0_1px_1px_rgba(0,0,0,0.02)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] data-[state=checked]:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--glass-border-strong))] data-[state=checked]:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-crisp),0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] active:scale-[0.985] disabled:cursor-not-allowed disabled:border-[color:color-mix(in_srgb,var(--glass-border)_58%,transparent)] disabled:bg-[color:color-mix(in_srgb,var(--surface-panel)_88%,var(--surface-subtle))] disabled:shadow-none disabled:opacity-60 ${className ?? ""}`}
        disabled={disabled}
        onCheckedChange={(nextChecked) => {
          if (!isControlled) {
            setInternalChecked(nextChecked);
          }
          onCheckedChange?.(nextChecked);
        }}
      >
        <RadixSwitch.Thumb
          data-testid="switch-thumb"
          className="block size-5 rounded-full border border-white/35 bg-[color:var(--surface-panel-strong)] shadow-[0_6px_14px_rgba(0,0,0,0.14)] transition-[transform,background-color,border-color] duration-150 ease-out data-[state=checked]:translate-x-[1.25rem] data-[state=checked]:border-[color:color-mix(in_srgb,var(--surface-panel-strong)_78%,transparent)] data-[state=checked]:bg-[color:color-mix(in_srgb,var(--surface-panel-strong)_82%,white)]"
        />
      </RadixSwitch.Root>
      <span>{label}</span>
    </label>
  );
}
