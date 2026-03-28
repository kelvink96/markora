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
      <div className="app-control-shell group/select relative">
        <select
          id={controlId}
          className={`app-control app-control-select pr-10 ${className ?? ""}`}
          {...props}
        >
          {children}
        </select>
        <span
          aria-hidden="true"
          data-testid="select-chevron"
          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-app-text-muted transition-colors duration-150 ease-out group-hover/select:text-app-text-secondary group-focus-within/select:text-app-text"
        >
          <svg
            viewBox="0 0 12 12"
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 4.5 6 7.5l3-3" />
          </svg>
        </span>
      </div>
    </Field>
  );
}
