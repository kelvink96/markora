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
        className={`size-4 rounded border border-[color:var(--glass-border)] accent-[color:var(--accent-strong)] ${className ?? ""}`}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
