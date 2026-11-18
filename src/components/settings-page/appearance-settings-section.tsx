import type {
  AppearanceSettings,
  ColorScheme,
  ThemePreference,
} from "../../features/settings/settings-schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SectionActions, SectionCard, SettingRow, hasChanges } from "./settings-page-shared";
import { SwatchGroup, SwatchPreview } from "./swatches";

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

/** A labelled dropdown whose values are numbers. */
function NumberSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: Array<{ value: number; label: string }>;
  onChange: (value: number) => void;
}) {
  return (
    <SettingRow controlId={id} label={label}>
      <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
        <SelectTrigger id={id} className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
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
  const canSave = hasChanges(appearance, savedAppearance);
  const scheme = appearance.colorScheme;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Appearance"
        description="Control the app chrome, shell theme, and supporting interface elements."
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Theme mode</div>
            <div className="text-xs text-muted-foreground">System follows your OS color scheme.</div>
          </div>
          <SwatchGroup<ThemePreference>
            label="Theme mode"
            testIdPrefix="theme-swatch"
            value={appearance.theme}
            onValueChange={(theme) => updateAppearance({ theme })}
            options={[
              {
                value: "system",
                title: "System",
                description: "Match your operating system preference.",
                attributes: { "data-theme": "system", "data-resolved-theme-mode": previewThemeMode },
                preview: (
                  // Light on one side of a diagonal, dark on the other: "it depends on your system".
                  <div className="relative">
                    <SwatchPreview scheme={scheme} mode="light" />
                    <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
                      <SwatchPreview scheme={scheme} mode="dark" />
                    </div>
                  </div>
                ),
              },
              {
                value: "light",
                title: "Light",
                description: "Keep the shell bright and airy.",
                attributes: { "data-theme": "light", "data-resolved-theme-mode": "light" },
                preview: <SwatchPreview scheme={scheme} mode="light" />,
              },
              {
                value: "dark",
                title: "Dark",
                description: "Use a darker shell for lower-glare editing.",
                attributes: { "data-theme": "dark", "data-resolved-theme-mode": "dark" },
                preview: <SwatchPreview scheme={scheme} mode="dark" />,
              },
            ]}
          />
        </div>
        <SectionActions canSave={canSave} label="Save theme mode" onSave={() => onSave(appearance)} />
      </SectionCard>

      <SectionCard
        title="Text"
        description="Set how large and how open the editor and preview text are."
      >
        <NumberSelect
          id="editor-font-size"
          label="Editor font size"
          value={appearance.editorFontSize}
          options={EDITOR_FONT_SIZES.map((size) => ({ value: size, label: `${size} px` }))}
          onChange={(editorFontSize) => updateAppearance({ editorFontSize })}
        />
        <NumberSelect
          id="editor-line-height"
          label="Editor line spacing"
          value={appearance.editorLineHeight}
          options={EDITOR_LINE_HEIGHTS}
          onChange={(editorLineHeight) => updateAppearance({ editorLineHeight })}
        />
        <NumberSelect
          id="preview-font-scale"
          label="Preview text size"
          value={appearance.previewFontScale}
          options={PREVIEW_FONT_SCALES}
          onChange={(previewFontScale) => updateAppearance({ previewFontScale })}
        />
        <SectionActions canSave={canSave} label="Save text settings" onSave={() => onSave(appearance)} />
      </SectionCard>

      <SectionCard title="Status Bar" description="Show or hide footer metrics.">
        <SettingRow controlId="status-bar-toggle" label="Show footer metrics">
          <Switch
            id="status-bar-toggle"
            checked={appearance.showStatusBar}
            onCheckedChange={(showStatusBar) => updateAppearance({ showStatusBar })}
          />
        </SettingRow>
        <SectionActions canSave={canSave} label="Save status bar" onSave={() => onSave(appearance)} />
      </SectionCard>

      <SectionCard
        title="Color Scheme"
        description="Choose the palette character that the whole app shell will use in both light and dark modes."
      >
        <SwatchGroup<ColorScheme>
          label="Color scheme"
          testIdPrefix="scheme-swatch"
          value={scheme}
          onValueChange={(colorScheme) => updateAppearance({ colorScheme })}
          options={[
            {
              value: "standard",
              title: "Aurora",
              description: "Cool indigo with a violet-to-cyan glow",
              attributes: { "data-color-scheme": "standard", "data-theme-mode": previewThemeMode },
              preview: <SwatchPreview scheme="standard" mode={previewThemeMode} />,
            },
            {
              value: "sepia",
              title: "Ember",
              description: "Warm graphite and amber, cream paper in light",
              attributes: { "data-color-scheme": "sepia", "data-theme-mode": previewThemeMode },
              preview: <SwatchPreview scheme="sepia" mode={previewThemeMode} />,
            },
            {
              value: "high-contrast",
              title: "High Contrast",
              description: "Maximum contrast, no decoration",
              attributes: { "data-color-scheme": "high-contrast", "data-theme-mode": previewThemeMode },
              preview: <SwatchPreview scheme="high-contrast" mode={previewThemeMode} />,
            },
          ]}
        />
        <SectionActions canSave={canSave} label="Save color scheme" onSave={() => onSave(appearance)} />
      </SectionCard>
    </div>
  );
}
