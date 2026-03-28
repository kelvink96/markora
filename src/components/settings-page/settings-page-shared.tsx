import type { ReactNode } from "react";
import { Button } from "../shared/button";
import { Card } from "../shared/card";
import { Text } from "../shared/text";
import { Title } from "../shared/title";

export function getSystemThemeMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SidebarButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-app-sm border border-transparent px-3 py-2 text-left text-sm transition ${
        isActive
          ? "bg-[color:var(--glass-elevated)] text-app-text shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
          : "text-app-text/70 hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)]"
      }`}
    >
      {label}
    </button>
  );
}

export function SectionCard({
  description,
  title,
  children,
}: {
  description: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-app-sm bg-[color:var(--glass-panel)] backdrop-blur-[var(--glass-blur-soft)]">
      <header className="mb-4 space-y-1">
        <Title as="h3" size="sm">
          {title}
        </Title>
        <Text tone="muted">{description}</Text>
      </header>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function FieldLabel({
  children,
  helper,
  htmlFor,
}: {
  children: ReactNode;
  helper?: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-sm text-app-text">
      <span>{children}</span>
      {helper ? <span className="text-xs text-app-text/60">{helper}</span> : null}
    </label>
  );
}

export function SectionActions({
  canSave,
  label = "Save changes",
  onSave,
}: {
  canSave: boolean;
  label?: string;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end pt-2">
      <Button disabled={!canSave} onClick={onSave}>
        {label}
      </Button>
    </div>
  );
}

export function hasChanges<T>(left: T, right: T) {
  return JSON.stringify(left) !== JSON.stringify(right);
}
