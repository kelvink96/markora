import type {
  AppearanceSettings,
  ColorScheme,
  ThemePreference,
} from "../../features/settings/settings-schema";
import { Checkbox } from "../shared/checkbox";
import { Select } from "../shared/select";
import {
  SectionActions,
  SectionCard,
  hasChanges,
} from "./settings-page-shared";

function ThemeModeSwatch({
  description,
  isSelected,
  onSelect,
  previewMode,
  resolvedThemeMode,
  title,
  value,
}: {
  description: string;
  isSelected: boolean;
  onSelect: (value: ThemePreference) => void;
  previewMode: "light" | "dark";
  resolvedThemeMode: "light" | "dark";
  title: string;
  value: ThemePreference;
}) {
  return (
    <button
      type="button"
      data-testid={`theme-swatch-${value}`}
      data-theme={value}
      data-resolved-theme-mode={resolvedThemeMode}
      onClick={() => onSelect(value)}
      className={`rounded-app-md border p-3 text-left transition ${
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
      <div
        className={`space-y-2 rounded-app-sm border border-current/10 p-3 ${
          previewMode === "dark"
            ? "bg-slate-950 text-slate-100"
            : "bg-stone-50 text-slate-900"
        }`}
      >
        <div className="text-sm font-semibold">Workspace chrome</div>
        <div className="text-xs opacity-75">
          {value === "system"
            ? `Follows your OS and resolves to ${resolvedThemeMode}.`
            : `Always use ${value} mode for the app shell.`}
        </div>
        <div className="flex items-center gap-2 text-xs opacity-75">
          <span className="h-px flex-1 bg-current/15" />
          <span>{previewMode} preview</span>
        </div>
        <div
          className={`inline-block rounded-app-sm border border-current/10 px-2 py-1 text-[11px] ${
            previewMode === "dark" ? "bg-slate-900" : "bg-white"
          }`}
        >
          theme sample
        </div>
      </div>
    </button>
  );
}

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

const EDITOR_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 24];
const EDITOR_LINE_HEIGHTS = [
  { value: 1.5, label: "Compact" },
  { value: 1.7, label: "Comfortable" },
  { value: 1.9, label: "Relaxed" },
  { value: 2.1, label: "Spacious" },
];
const PREVIEW_FONT_SCALES = [
  { value: 0.9, label: "90%" },
  { value: 1, label: "100%" },
  { value: 1.1, label: "110%" },
  { value: 1.25, label: "125%" },
  { value: 1.5, label: "150%" },
];

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

  const themeCards: Array<{
    description: string;
    resolvedThemeMode: "light" | "dark";
    title: string;
    value: ThemePreference;
  }> = [
    {
      title: "System",
      description: "Match your operating system preference.",
      value: "system",
      resolvedThemeMode: previewThemeMode,
    },
    {
      title: "Light",
      description: "Keep the shell bright and airy.",
      value: "light",
      resolvedThemeMode: "light",
    },
    {
      title: "Dark",
      description: "Use a darker shell for lower-glare editing.",
      value: "dark",
      resolvedThemeMode: "dark",
    },
  ];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Appearance"
        description="Control the app chrome, shell theme, and supporting interface elements."
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-app-text">Theme mode</div>
            <div className="text-xs text-app-text/60">
              System follows your OS color scheme.
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {themeCards.map((themeCard) => (
              <ThemeModeSwatch
                key={themeCard.value}
                title={themeCard.title}
                description={themeCard.description}
                previewMode={themeCard.resolvedThemeMode}
                resolvedThemeMode={themeCard.resolvedThemeMode}
                value={themeCard.value}
                isSelected={appearance.theme === themeCard.value}
                onSelect={(value) => updateAppearance({ theme: value })}
              />
            ))}
          </div>
        </div>

        <SectionActions
          canSave={hasChanges(appearance, savedAppearance)}
          label="Save theme mode"
          onSave={() => onSave(appearance)}
        />
      </SectionCard>

      <SectionCard
        title="Text"
        description="Set how large and how open the editor and preview text are."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            id="editor-font-size"
            label="Editor font size"
            value={String(appearance.editorFontSize)}
            onChange={(event) => updateAppearance({ editorFontSize: Number(event.target.value) })}
          >
            {EDITOR_FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </Select>
          <Select
            id="editor-line-height"
            label="Editor line spacing"
            value={String(appearance.editorLineHeight)}
            onChange={(event) => updateAppearance({ editorLineHeight: Number(event.target.value) })}
          >
            {EDITOR_LINE_HEIGHTS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            id="preview-font-scale"
            label="Preview text size"
            value={String(appearance.previewFontScale)}
            onChange={(event) => updateAppearance({ previewFontScale: Number(event.target.value) })}
          >
            {PREVIEW_FONT_SCALES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <SectionActions
          canSave={hasChanges(appearance, savedAppearance)}
          label="Save text settings"
          onSave={() => onSave(appearance)}
        />
      </SectionCard>

      <SectionCard
        title="Status Bar"
        description="Show or hide footer metrics."
      >
        <Checkbox
          id="status-bar-toggle"
          label="Show footer metrics"
          checked={appearance.showStatusBar}
          onChange={(event) =>
            updateAppearance({ showStatusBar: event.target.checked })
          }
        />
        <SectionActions
          canSave={hasChanges(appearance, savedAppearance)}
          label="Save status bar"
          onSave={() => onSave(appearance)}
        />
      </SectionCard>

      <SectionCard
        title="Color Scheme"
        description="Choose the palette character that the whole app shell will use in both light and dark modes."
      >
        <div className="text-xs text-app-text/60">
          Each scheme adapts to the current theme mode, so the shell, editor, and preview stay aligned.
        </div>
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
