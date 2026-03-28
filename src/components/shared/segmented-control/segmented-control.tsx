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
            className={`rounded-app-sm px-3 py-1.5 text-[0.85rem] font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-out ${
              option.icon ? "size-10 px-0 py-1" : ""
            } ${
              selected
                ? "border border-[color:color-mix(in_srgb,var(--glass-border)_74%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))] text-app-text shadow-[var(--shadow-crisp)]"
                : "border border-transparent text-app-text-secondary hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_94%,var(--surface-panel-strong))] hover:text-app-text"
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
