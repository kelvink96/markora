import * as Switch from "@radix-ui/react-switch";
import "./theme-toggle.css";

interface ThemeToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ThemeToggle({ checked, onCheckedChange }: ThemeToggleProps) {
  return (
    <Switch.Root
      className="theme-toggle"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Toggle theme"
    >
      <Switch.Thumb />
    </Switch.Root>
  );
}
