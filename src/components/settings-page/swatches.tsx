import { useId, type ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface SwatchOption<T extends string> {
  value: T;
  title: string;
  description: string;
  preview: ReactNode;
  /** Extra attributes for the option's button (kept for the tests and for styling hooks). */
  attributes?: Record<string, string>;
}

/**
 * A radio group whose options are big visual cards. Each card is the label of a standard radio, so
 * clicking anywhere on it picks it, and arrow keys move between them.
 */
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
  const idPrefix = useId();

  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={className}
    >
      {options.map((option) => {
        const id = `${idPrefix}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex cursor-pointer flex-col gap-3 rounded-xl border bg-card/60 p-3 transition-[border-color,box-shadow,background-color] hover:border-ring/60 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/40 has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-primary/30"
          >
            {option.preview}
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
              <RadioGroupItem
                id={id}
                value={option.value}
                data-testid={`${testIdPrefix}-${option.value}`}
                {...option.attributes}
                // The card shows focus for the whole option, so the radio's own ring would be a second one.
                className="mt-0.5 focus-visible:ring-0"
              />
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
