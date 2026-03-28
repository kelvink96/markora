import type { ReactNode } from "react";
import { Text } from "../text";
import { Title } from "../title";

interface DialogProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
}

export function Dialog({ actions, children, description, open, title }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/38 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="app-flyout w-full max-w-md p-5"
      >
        <div className="space-y-2">
          <Title as="h2" size="sm" id="dialog-title">
            {title}
          </Title>
          {description ? <Text tone="muted">{description}</Text> : null}
        </div>
        <div className="mt-4">{children}</div>
        {actions ? <div className="mt-4 flex justify-end gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
