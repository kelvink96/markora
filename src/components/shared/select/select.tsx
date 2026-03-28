import type { PropsWithChildren, SelectHTMLAttributes } from "react";
import { Field } from "../field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  helper?: string;
  label: string;
  message?: string;
}

export function Select({
  children,
  className,
  helper,
  id,
  label,
  message,
  ...props
}: PropsWithChildren<SelectProps>) {
  const controlId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field label={label} helper={helper} message={message} htmlFor={controlId}>
      <select
        id={controlId}
        className={`w-full rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 text-app-text backdrop-blur-[var(--glass-blur-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 ${className ?? ""}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
