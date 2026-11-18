import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ColorScheme } from "../../features/settings/settings-schema";

/** A miniature of the app drawn with a scheme's real colours (see data-swatch in themes.css). */
export function SwatchPreview({ scheme, mode }: { scheme: ColorScheme; mode: "light" | "dark" }) {
  return (
    <div
      data-swatch-scheme={scheme}
      data-swatch-mode={mode}
      aria-hidden="true"
      className="overflow-hidden rounded-md border bg-background"
    >
      <div className="flex items-center gap-1 border-b bg-card px-2 py-1.5">
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        <span className="ml-1 h-1 w-6 rounded-full bg-primary" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="space-y-1 bg-editor p-2">
          <span className="block h-1 w-2/3 rounded-full bg-syntax-heading" />
          <span className="block h-1 w-full rounded-full bg-muted-foreground/50" />
          <span className="block h-1 w-5/6 rounded-full bg-muted-foreground/50" />
          <span className="block h-1 w-1/2 rounded-full bg-syntax-link" />
          <span className="block h-1 w-3/5 rounded-full bg-syntax-code" />
        </div>
        <div className="space-y-1 bg-preview p-2">
          <span className="block h-1.5 w-3/4 rounded-full bg-foreground" />
          <span className="block h-1 w-full rounded-full bg-muted-foreground/40" />
          <span className="block h-1 w-5/6 rounded-full bg-muted-foreground/40" />
          <span className="block h-2 w-1/3 rounded bg-primary" />
        </div>
      </div>
    </div>
  );
}

export interface SwatchOption<T extends string> {
  value: T;
  title: string;
  description: string;
  preview: ReactNode;
  /** Extra attributes for the option's button (kept for the tests and for styling hooks). */
  attributes?: Record<string, string>;
}

/** A radio group whose options are big visual cards. Arrow keys move between them. */
export function SwatchGroup<T extends string>({
  label,
  value,
  onValueChange,
  options,
  testIdPrefix,
  className = "md:grid-cols-3",
}: {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: Array<SwatchOption<T>>;
  testIdPrefix: string;
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={`grid gap-3 ${className}`}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          data-testid={`${testIdPrefix}-${option.value}`}
          {...option.attributes}
          className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card/60 p-3 text-left outline-none transition-[border-color,box-shadow,background-color] hover:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-accent/40 data-[state=checked]:ring-2 data-[state=checked]:ring-primary/30"
        >
          {option.preview}
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{option.title}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground">
              <RadioGroupPrimitive.Indicator>
                <Check aria-hidden="true" className="size-3" />
              </RadioGroupPrimitive.Indicator>
            </span>
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
