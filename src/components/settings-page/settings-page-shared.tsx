import type { ReactNode } from "react";
import {
  FilePlus2,
  FolderOpen,
  Info,
  Palette,
  PenSquare,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "../shared/button";
import { Card } from "../shared/card";
import { Text } from "../shared/text";
import { Title } from "../shared/title";
import type { SettingsNavigationIcon } from "./settings-navigation";

export function getSystemThemeMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SidebarButton({
  icon,
  iconTestId,
  isHighContrast,
  isActive,
  label,
  onClick,
}: {
  icon: SettingsNavigationIcon;
  iconTestId: string;
  isHighContrast?: boolean;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  const iconMap: Record<SettingsNavigationIcon, ReactNode> = {
    palette: <Palette data-testid={iconTestId} className="size-4" />,
    "pen-square": <PenSquare data-testid={iconTestId} className="size-4" />,
    "folder-open": <FolderOpen data-testid={iconTestId} className="size-4" />,
    info: <Info data-testid={iconTestId} className="size-4" />,
    "sliders-horizontal": <SlidersHorizontal data-testid={iconTestId} className="size-4" />,
    "file-plus-2": <FilePlus2 data-testid={iconTestId} className="size-4" />,
  };

  const activeClassName = isHighContrast
    ? "border-2 border-l-4 border-[color:var(--app-text)] bg-[color:color-mix(in_srgb,var(--surface-panel)_92%,var(--surface-panel-strong))] font-semibold text-app-text shadow-[0_0_0_1px_var(--app-text)]"
    : "bg-[color:var(--glass-elevated)] text-app-text shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]";
  const iconClassName = isActive ? "text-app-text" : "text-app-text/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-app-sm border border-transparent px-3 py-2 text-left text-sm transition ${
        isActive
          ? activeClassName
          : "text-app-text/70 hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)]"
      }`}
    >
      <span className="flex items-center gap-3">
        <span aria-hidden="true" className={`shrink-0 transition ${iconClassName}`}>
          {iconMap[icon]}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </span>
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
      <Button
        disabled={!canSave}
        leftSection={<Save data-testid="settings-save-icon" className="size-4" />}
        onClick={onSave}
      >
        {label}
      </Button>
    </div>
  );
}

export function hasChanges<T>(left: T, right: T) {
  return JSON.stringify(left) !== JSON.stringify(right);
}
