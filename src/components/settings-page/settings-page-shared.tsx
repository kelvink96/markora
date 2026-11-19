import type { ReactNode } from "react";
import { Eye, FolderOpen, Palette, PenSquare } from "lucide-react";
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
        "relative flex cursor-pointer md:w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-3",
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

/** A group of settings on the page: a heading, then rows divided by hairlines. */
export function SettingsGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h3 id={`${id}-heading`} className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="divide-y">{children}</div>
    </section>
  );
}

/**
 * A label with optional help text on the left and its control on the right (a switch, a select).
 * `controlId` ties the label and the help text to the control for assistive technology.
 * When `changed`, a dot appears that resets just this setting through `onReset`.
 */
export function SettingRow({
  controlId,
  label,
  description,
  changed = false,
  onReset,
  stacked = false,
  children,
}: {
  controlId: string;
  label: string;
  description?: string;
  changed?: boolean;
  onReset?: () => void;
  /** Put the control under the label instead of beside it (for wide controls like swatches). */
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "gap-3 py-4 first:pt-2 last:pb-2",
        stacked ? "flex flex-col" : "flex items-start justify-between gap-6",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={controlId} className="text-sm leading-5">
            {label}
          </Label>
          {changed ? (
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${label} to default`}
              title="Changed from default. Click to reset."
              className="size-2 shrink-0 cursor-pointer rounded-full bg-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          ) : null}
        </div>
        {description ? (
          <p id={`${controlId}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className={stacked ? undefined : "shrink-0"}>{children}</div>
    </div>
  );
}
