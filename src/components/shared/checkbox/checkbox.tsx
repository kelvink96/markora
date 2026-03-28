import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ className, id, label, ...props }: CheckboxProps) {
  const controlId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={controlId} className="inline-flex items-center gap-3 text-sm text-app-text">
      <input
        id={controlId}
        type="checkbox"
        className={`peer sr-only ${className ?? ""}`}
        {...props}
      />
      <span
        aria-hidden="true"
        data-testid="checkbox-control"
        className="flex size-[1.125rem] shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)-1px)] border border-[color:color-mix(in_srgb,var(--glass-border)_70%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_86%,var(--surface-panel-strong))] text-transparent shadow-[var(--shadow-crisp)] transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out peer-hover:border-[color:color-mix(in_srgb,var(--glass-border-strong)_60%,var(--accent)_18%)] peer-focus-visible:border-[color:color-mix(in_srgb,var(--accent)_42%,var(--glass-border-strong))] peer-focus-visible:shadow-[var(--shadow-crisp),0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] peer-checked:border-[color:color-mix(in_srgb,var(--accent)_55%,var(--glass-border-strong))] peer-checked:bg-[color:var(--accent-strong)] peer-checked:text-[color:var(--surface-panel-strong)] peer-active:scale-[0.97] peer-disabled:cursor-not-allowed peer-disabled:border-[color:color-mix(in_srgb,var(--glass-border)_58%,transparent)] peer-disabled:bg-[color:color-mix(in_srgb,var(--surface-panel)_88%,var(--surface-subtle))] peer-disabled:text-transparent peer-disabled:opacity-60"
      >
        <svg
          viewBox="0 0 12 12"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.2 4.9 8.5 9.5 3.8" />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
}
