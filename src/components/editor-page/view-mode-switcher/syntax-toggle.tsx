import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SyntaxToggleProps {
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
}

/** Show raw markdown in the Write view instead of rendering it inline. */
export function SyntaxToggle({ checked, onCheckedChange }: SyntaxToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-2" data-testid="syntax-toggle">
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-xs font-normal text-muted-foreground max-md:sr-only">
        Show syntax
      </Label>
    </div>
  );
}
