import * as Switch from "@radix-ui/react-switch";

interface ThemeToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ThemeToggle({ checked, onCheckedChange }: ThemeToggleProps) {
  return (
    <Switch.Root
      className="inline-flex h-8 w-[3.2rem] shrink-0 items-center rounded-full border border-black/10 bg-app-panel-strong p-[0.2rem] transition-colors duration-150 ease-out hover:bg-app-panel data-[state=checked]:border-[rgba(45,91,134,0.22)] data-[state=checked]:bg-[rgba(45,91,134,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Toggle theme"
    >
      <Switch.Thumb className="block size-[1.35rem] rounded-full bg-app-panel-strong shadow-[0_6px_14px_rgba(17,28,38,0.14)] transition-transform duration-150 ease-out data-[state=checked]:translate-x-5" />
    </Switch.Root>
  );
}
