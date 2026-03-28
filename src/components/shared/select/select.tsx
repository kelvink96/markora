import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import { Field } from "../field";

interface SelectProps {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  helper?: string;
  id?: string;
  label: string;
  message?: string;
  name?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  value?: string;
}

interface SelectOption {
  disabled?: boolean;
  label: ReactNode;
  value: string;
}

function getOptionValue(value: unknown) {
  return value === undefined || value === null ? "" : String(value);
}

function getOptions(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") {
      return [];
    }

    const option = child as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;
    return [
      {
        disabled: option.props.disabled,
        label: option.props.children,
        value: getOptionValue(option.props.value),
      } satisfies SelectOption,
    ];
  });
}

export function Select({
  children,
  className,
  defaultValue,
  disabled = false,
  helper,
  id,
  label,
  message,
  name,
  onChange,
  value,
}: PropsWithChildren<SelectProps>) {
  const controlId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const options = useMemo(() => getOptions(children), [children]);
  const isControlled = value !== undefined;
  const initialValue = getOptionValue(defaultValue) || options[0]?.value || "";
  const [internalValue, setInternalValue] = useState(initialValue);

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(initialValue);
    }
  }, [initialValue, isControlled]);

  const resolvedValue = isControlled ? getOptionValue(value) : internalValue;
  const selectedOption = options.find((option) => option.value === resolvedValue) ?? options[0];

  const emitChange = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    if (!onChange) {
      return;
    }

    const syntheticEvent = {
      target: {
        id: controlId,
        name,
        value: nextValue,
      },
      currentTarget: {
        id: controlId,
        name,
        value: nextValue,
      },
    } as ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
  };

  return (
    <Field label={label} helper={helper} message={message} htmlFor={controlId}>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            id={controlId}
            type="button"
            className={`app-control app-control-select inline-flex items-center justify-between gap-3 text-left ${className ?? ""}`}
            disabled={disabled}
          >
            <span className="min-w-0 truncate">{selectedOption?.label}</span>
            <span
              aria-hidden="true"
              data-testid="select-chevron"
              className="pointer-events-none flex shrink-0 items-center justify-center text-app-text-muted transition-colors duration-150 ease-out"
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
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            className="app-flyout-solid z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5"
            sideOffset={8}
          >
            <DropdownMenu.RadioGroup value={resolvedValue} onValueChange={emitChange}>
              {options.map((option) => (
                <DropdownMenu.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex w-full items-center justify-between gap-3 rounded-app-sm border border-transparent px-3 py-2 text-left text-[0.95rem] text-app-text outline-none transition-[background-color,border-color,color] duration-150 ease-out focus:bg-[color:color-mix(in_srgb,var(--surface-panel)_96%,var(--surface-panel-strong))] focus:text-app-text data-[state=checked]:border-[color:color-mix(in_srgb,var(--glass-border)_68%,var(--glass-border-strong))] data-[state=checked]:bg-[color:color-mix(in_srgb,var(--surface-panel)_96%,var(--surface-panel-strong))] data-[disabled]:pointer-events-none data-[disabled]:text-app-text-muted data-[disabled]:opacity-50"
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <DropdownMenu.ItemIndicator className="shrink-0 text-app-accent-strong">
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
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </Field>
  );
}
