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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-md rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] p-5 shadow-[0_18px_40px_rgba(30,43,52,0.18)] backdrop-blur-[var(--glass-blur-strong)]"
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
