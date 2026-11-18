import type { ReactNode } from "react";
import { Eye, FilePlus2, FolderOpen, Info, Palette, PenSquare, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SettingsNavigationIcon } from "./settings-navigation";

export function getSystemThemeMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light" as const;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const NAVIGATION_ICONS: Record<SettingsNavigationIcon, typeof Palette> = {
  palette: Palette,
  "pen-square": PenSquare,
  eye: Eye,
  "folder-open": FolderOpen,
  info: Info,
  "sliders-horizontal": SlidersHorizontal,
  "file-plus-2": FilePlus2,
};

export function SidebarButton({
  icon,
  iconTestId,
  isActive,
  label,
  onClick,
}: {
  icon: SettingsNavigationIcon;
  iconTestId: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = NAVIGATION_ICONS[icon];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-3",
        isActive
          ? "bg-accent font-medium text-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-linear-to-b before:from-brand-from before:to-brand-to"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <Icon data-testid={iconTestId} aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** One group of settings on the page: a titled card with the controls inside. */
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
    <Card className="gap-5 bg-card/80 py-5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle role="heading" aria-level={3} className="text-base">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

/**
 * A label with optional help text on the left and its control on the right (a switch, a select).
 * `controlId` ties the label and the help text to the control for assistive technology.
 */
export function SettingRow({
  controlId,
  label,
  description,
  children,
}: {
  controlId: string;
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={controlId} className="text-sm leading-5">
          {label}
        </Label>
        {description ? (
          <p id={`${controlId}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
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
    <div className="flex justify-end pt-1">
      <Button disabled={!canSave} onClick={onSave}>
        <Save data-testid="settings-save-icon" aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}

export function hasChanges<T>(left: T, right: T) {
  return JSON.stringify(left) !== JSON.stringify(right);
}
