import * as Switch from "@radix-ui/react-switch";

interface ThemeToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ThemeToggle({ checked, onCheckedChange }: ThemeToggleProps) {
  return (
    <Switch.Root
      className="inline-flex h-8 w-[3.2rem] shrink-0 items-center rounded-full border border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_82%,var(--surface-panel-strong))] p-[0.2rem] shadow-[var(--shadow-crisp),0_1px_1px_rgba(0,0,0,0.02)] transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] data-[state=checked]:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--glass-border-strong))] data-[state=checked]:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--shadow-crisp),0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Toggle theme"
    >
      <Switch.Thumb className="block size-[1.35rem] rounded-full border border-white/35 bg-[color:var(--surface-panel-strong)] shadow-[0_6px_14px_rgba(17,28,38,0.14)] transition-[transform,background-color,border-color] duration-150 ease-out data-[state=checked]:translate-x-5 data-[state=checked]:bg-[color:color-mix(in_srgb,var(--surface-panel-strong)_82%,white)]" />
    </Switch.Root>
  );
}
