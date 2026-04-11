import type { ReactNode } from "react";

type SegmentedOption<T extends string> = {
  ariaLabel?: string;
  icon?: ReactNode;
  label: string;
  value: T;
};

interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  onValueChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  value: T;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  onValueChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="app-toolbar inline-flex items-center p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-label={option.ariaLabel}
            aria-selected={selected}
            className={`rounded-app-sm px-3 py-1.5 text-[0.85rem] font-medium transition-colors duration-150 hover:cursor-pointer ${
              option.icon ? "size-10 px-0 py-1" : ""
            } ${
              selected
                ? "bg-[color:color-mix(in_srgb,var(--surface-panel)_75%,var(--surface-subtle))] text-app-text"
                : "text-app-text-secondary hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_94%,var(--surface-panel-strong))] hover:text-app-text"
            }`}
            onClick={() => onValueChange(option.value)}
          >
            {option.icon ?? option.label}
          </button>
        );
      })}
    </div>
  );
}
