type SegmentedOption<T extends string> = {
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
      className="inline-flex items-center rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-0.5 backdrop-blur-[var(--glass-blur-soft)] shadow-[var(--shadow-crisp)]"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`rounded-app-sm px-3 py-1.5 text-[0.85rem] font-medium transition-[background-color,color] ${
              selected
                ? "bg-[color:var(--glass-elevated)] text-app-text"
                : "text-app-text-secondary hover:bg-[color:var(--glass-hover)]"
            }`}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
