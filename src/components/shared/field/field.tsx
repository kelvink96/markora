import { isValidElement, type ReactNode } from "react";
import { Text } from "../text";

interface FieldProps {
  children: ReactNode;
  helper?: string;
  htmlFor?: string;
  label: string;
  message?: string;
}

function getChildId(children: ReactNode) {
  if (!isValidElement(children)) {
    return undefined;
  }

  return typeof children.props === "object" && children.props !== null && "id" in children.props
    ? String(children.props.id)
    : undefined;
}

export function Field({ children, helper, htmlFor, label, message }: FieldProps) {
  const controlId = htmlFor ?? getChildId(children);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label htmlFor={controlId} className="flex flex-col gap-1 text-sm text-app-text">
          <Text as="span">{label}</Text>
        </label>
        {helper ? (
          <Text as="span" size="xs" tone="subtle">
            {helper}
          </Text>
        ) : null}
      </div>
      {children}
      {message ? (
        <Text as="span" size="xs" tone="muted">
          {message}
        </Text>
      ) : null}
    </div>
  );
}
