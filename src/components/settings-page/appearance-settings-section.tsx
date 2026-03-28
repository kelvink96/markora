import type {
  AppearanceSettings,
  ColorScheme,
  ThemePreference,
} from "../../features/settings/settings-schema";
import { Checkbox } from "../shared/checkbox";
import { Field } from "../shared/field";
import { Select } from "../shared/select";
import {
  SectionActions,
  SectionCard,
  hasChanges,
} from "./settings-page-shared";

function ColorSchemeSwatch({
  description,
  isSelected,
  onSelect,
  themeMode,
  title,
  value,
}: {
  description: string;
  isSelected: boolean;
  onSelect: (value: ColorScheme) => void;
  themeMode: "light" | "dark";
  title: string;
  value: ColorScheme;
}) {
  return (
    <button
      type="button"
      data-testid={`scheme-swatch-${value}`}
      data-color-scheme={value}
      data-theme-mode={themeMode}
      onClick={() => onSelect(value)}
      className={`scheme-swatch rounded-app-md border p-3 text-left transition ${
        isSelected
          ? "border-[color:var(--accent-strong)] shadow-[0_0_0_1px_var(--accent-strong)]"
          : "border-[color:var(--glass-border-strong)] hover:border-[color:var(--glass-border)]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs opacity-75">{description}</div>
        </div>
        <div
          className={`h-3 w-3 rounded-full border ${
            isSelected ? "border-current bg-current" : "border-current/50"
          }`}
          aria-hidden="true"
        />
      </div>
      <div className="space-y-2 rounded-app-sm border border-current/10 bg-[color:var(--glass-panel-strong)] p-3">
        <div className="font-[var(--font-prose)] text-sm font-semibold">Heading</div>
        <div className="font-[var(--font-prose)] text-xs opacity-80">
          Shell, editor, and preview all follow this scheme.
        </div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span className="h-px flex-1 bg-current/15" />
          <span>accent</span>
        </div>
        <div className="inline-block rounded-app-sm border border-current/10 bg-[color:var(--surface-editor)] px-2 py-1 font-[var(--font-editor)] text-[11px]">
          ui sample
        </div>
      </div>
    </button>
  );
}

interface AppearanceSettingsSectionProps {
  appearance: AppearanceSettings;
  savedAppearance: AppearanceSettings;
  previewThemeMode: "light" | "dark";
  onAppearanceChange: (appearance: AppearanceSettings) => void;
  onSave: (appearance: AppearanceSettings) => void;
}

export function AppearanceSettingsSection({
  appearance,
  savedAppearance,
  previewThemeMode,
  onAppearanceChange,
  onSave,
}: AppearanceSettingsSectionProps) {
  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    onAppearanceChange({ ...appearance, ...updates });
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Appearance"
        description="Control the app chrome, shell theme, and supporting interface elements."
      >
        <Select
          id="theme-preference"
          className="w-full rounded-app-sm"
          label="Theme mode"
          helper="System follows your OS color scheme."
          value={appearance.theme}
          onChange={(event) =>
            updateAppearance({ theme: event.target.value as ThemePreference })
          }
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>

        <Field
          label="Show status bar"
          helper="Keep the footer metrics visible while writing."
        >
          <Checkbox
            id="status-bar-toggle"
            label="Keep the footer metrics visible while writing"
            checked={appearance.showStatusBar}
            onChange={(event) =>
              updateAppearance({ showStatusBar: event.target.checked })
            }
          />
        </Field>
        <SectionActions
          canSave={hasChanges(appearance, savedAppearance)}
          label="Save theme mode"
          onSave={() => onSave(appearance)}
        />
      </SectionCard>

      <SectionCard
        title="Color Scheme"
        description="Choose the palette character that the whole app shell will use in both light and dark modes."
      >
        <Select
          id="color-scheme"
          className="w-full rounded-app-sm"
          label="Color scheme"
          helper="Each scheme adapts to the current theme mode, so the shell, editor, and preview stay aligned."
          value={appearance.colorScheme}
          onChange={(event) =>
            updateAppearance({ colorScheme: event.target.value as ColorScheme })
          }
        >
          <option value="standard">Standard</option>
          <option value="sepia">Sepia</option>
          <option value="high-contrast">High Contrast</option>
        </Select>
        <div className="grid gap-3 md:grid-cols-2">
          <ColorSchemeSwatch
            title="Standard"
            description="Default Markora neutral"
            themeMode={previewThemeMode}
            value="standard"
            isSelected={appearance.colorScheme === "standard"}
            onSelect={(value) => updateAppearance({ colorScheme: value })}
          />
          <ColorSchemeSwatch
            title="Sepia"
            description="Warm editorial palette"
            themeMode={previewThemeMode}
            value="sepia"
            isSelected={appearance.colorScheme === "sepia"}
            onSelect={(value) => updateAppearance({ colorScheme: value })}
          />
          <ColorSchemeSwatch
            title="High Contrast"
            description="Sharper accessibility-first contrast"
            themeMode={previewThemeMode}
            value="high-contrast"
            isSelected={appearance.colorScheme === "high-contrast"}
            onSelect={(value) => updateAppearance({ colorScheme: value })}
          />
        </div>
        <SectionActions
          canSave={hasChanges(appearance, savedAppearance)}
          label="Save color scheme"
          onSave={() => onSave(appearance)}
        />
      </SectionCard>
    </div>
  );
}
