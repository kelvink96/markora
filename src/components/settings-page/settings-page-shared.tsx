import type { ReactNode } from "react";
import { Eye, FolderOpen, Palette, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
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
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      // The jump list scrolls within this one page, so the entry in view is a location, not a page.
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "relative justify-start gap-3 rounded-lg px-3 font-normal md:w-full has-[>svg]:px-3",
        isActive
          ? "bg-accent font-medium text-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-linear-to-b before:from-brand-from before:to-brand-to"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <Icon data-testid={iconTestId} aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </Button>
  );
}

/** A group of settings on the page: a heading, then rows divided by hairlines. */
export function SettingsGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h3 id={`${id}-heading`} className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <FieldGroup className="gap-0 divide-y">{children}</FieldGroup>
    </section>
  );
}

/**
 * One setting as a Field: its label and optional help text on the left, the control on the right (a
 * switch, a select). `controlId` ties the label and the help text to the control for assistive technology.
 * When `changed`, a dot appears that resets just this setting through `onReset`.
 */
export function SettingRow({
  controlId,
  label,
  description,
  changed = false,
  onReset,
  stacked = false,
  labelable = true,
  children,
}: {
  controlId: string;
  label: string;
  description?: string;
  changed?: boolean;
  onReset?: () => void;
  /** Put the control under the label instead of beside it (for wide controls like swatches). */
  stacked?: boolean;
  /**
   * False when no element has the id `controlId` (groups, steppers). The title then names the row's
   * group instead of labelling one control.
   */
  labelable?: boolean;
  children: ReactNode;
}) {
  const titleId = `${controlId}-title`;

  return (
    <Field
      orientation={stacked ? "vertical" : "horizontal"}
      aria-labelledby={labelable ? undefined : titleId}
      className={cn("py-4 first:pt-2 last:pb-2", stacked ? "gap-3" : "gap-6")}
    >
      <FieldContent className="min-w-0">
        <div className="flex items-center gap-2">
          {labelable ? (
            <FieldLabel htmlFor={controlId} className="leading-5">
              {label}
            </FieldLabel>
          ) : (
            <FieldTitle id={titleId} className="leading-5">
              {label}
            </FieldTitle>
          )}
          {changed ? (
            // A full-size button around the small dot, pulled into the label's line height so showing it
            // never shifts the row.
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onReset}
              aria-label={`Reset ${label} to default`}
              title="Changed from default. Click to reset."
              className="-my-1 -ml-1.5 pointer-coarse:-my-3"
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
            </Button>
          ) : null}
        </div>
        {description ? <FieldDescription id={`${controlId}-description`}>{description}</FieldDescription> : null}
      </FieldContent>
      <div className={stacked ? undefined : "shrink-0"}>{children}</div>
    </Field>
  );
}
