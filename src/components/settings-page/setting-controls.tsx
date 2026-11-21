import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { COLOR_SCHEMES } from "../../features/settings/color-schemes";
import {
  EDITOR_FONT_SIZES,
  PREVIEW_SCALES,
  type ColorScheme,
  type MarkoraSettings,
  type PreviewSettings,
  type ThemePreference,
} from "../../features/settings/settings-schema";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SchemePreview } from "../scheme-preview";
import { SaveFolderControl } from "./save-folder-control";
import { SwatchGroup } from "./swatches";

const LINE_SPACINGS = [
  { value: 1.5, label: "Compact" },
  { value: 1.7, label: "Comfortable" },
  { value: 1.9, label: "Relaxed" },
  { value: 2.1, label: "Spacious" },
];
const PREVIEW_SCALE_OPTIONS = PREVIEW_SCALES.map((value) => ({ value, label: `${Math.round(value * 100)}%` }));
const CONTENT_WIDTHS: Array<{ value: PreviewSettings["contentWidth"]; label: string }> = [
  { value: "narrow", label: "Narrow" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
];

/** A row of 2-4 mutually exclusive options. Clicking the selected option again does nothing. */
export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label={label}
      value={String(value)}
      onValueChange={(next) => {
        const option = options.find((candidate) => String(candidate.value) === next);
        if (option) onChange(option.value);
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={String(option.value)} value={String(option.value)}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Steps the editor font size through the allowed sizes, with a sample at the chosen size. Its settings
 * row is the group named "Editor font size", so the stepper doesn't name itself again.
 */
export function FontSizeStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const smaller = [...EDITOR_FONT_SIZES].reverse().find((size) => size < value);
  const larger = EDITOR_FONT_SIZES.find((size) => size > value);

  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="w-8 text-center" style={{ fontSize: value }}>
        Aa
      </span>
      <ButtonGroup>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease font size"
          disabled={smaller === undefined}
          onClick={() => smaller !== undefined && onChange(smaller)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <ButtonGroupText aria-live="polite" className="min-w-16 justify-center font-normal tabular-nums">
          {value} px
        </ButtonGroupText>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase font size"
          disabled={larger === undefined}
          onClick={() => larger !== undefined && onChange(larger)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </ButtonGroup>
    </div>
  );
}

export interface ControlContext {
  settings: MarkoraSettings;
  previewThemeMode: "light" | "dark";
  /** Applies a full new settings object; the page routes each changed group to its handler. */
  update: (next: MarkoraSettings) => void;
  /** Desktop only: opens the native folder picker for the default save folder. */
  onPickFolder?: () => Promise<string | null>;
  /** Desktop only: whether a stored folder still exists. */
  folderExists?: (path: string) => Promise<boolean>;
}

/** The input for one catalog setting, keyed by its id. Returns null for ids without a plain control. */
export function renderControl(
  id: string,
  { settings, previewThemeMode, update, onPickFolder, folderExists }: ControlContext,
): ReactNode {
  const { appearance, editor, preview, files } = settings;
  const setAppearance = (patch: Partial<typeof appearance>) =>
    update({ ...settings, appearance: { ...appearance, ...patch } });
  const setEditor = (patch: Partial<typeof editor>) => update({ ...settings, editor: { ...editor, ...patch } });
  const setPreview = (patch: Partial<typeof preview>) => update({ ...settings, preview: { ...preview, ...patch } });
  const setFiles = (patch: Partial<typeof files>) => update({ ...settings, files: { ...files, ...patch } });
  const scheme = appearance.colorScheme;

  switch (id) {
    case "theme":
      return (
        <SwatchGroup<ThemePreference>
          label="Theme mode"
          testIdPrefix="theme-swatch"
          value={appearance.theme}
          onValueChange={(theme) => setAppearance({ theme })}
          options={[
            {
              value: "system",
              title: "System",
              description: "Match your operating system preference.",
              attributes: { "data-theme": "system", "data-resolved-theme-mode": previewThemeMode },
              preview: (
                // Light on one side of a diagonal, dark on the other: "it depends on your system".
                <div className="relative">
                  <SchemePreview scheme={scheme} mode="light" />
                  <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
                    <SchemePreview scheme={scheme} mode="dark" />
                  </div>
                </div>
              ),
            },
            {
              value: "light",
              title: "Light",
              description: "Keep the shell bright and airy.",
              attributes: { "data-theme": "light", "data-resolved-theme-mode": "light" },
              preview: <SchemePreview scheme={scheme} mode="light" />,
            },
            {
              value: "dark",
              title: "Dark",
              description: "Use a darker shell for lower-glare editing.",
              attributes: { "data-theme": "dark", "data-resolved-theme-mode": "dark" },
              preview: <SchemePreview scheme={scheme} mode="dark" />,
            },
          ]}
        />
      );
    case "colorScheme":
      return (
        <SwatchGroup<ColorScheme>
          label="Color scheme"
          testIdPrefix="scheme-swatch"
          className="md:grid-cols-4"
          value={scheme}
          onValueChange={(colorScheme) => setAppearance({ colorScheme })}
          options={COLOR_SCHEMES.map(({ id, name, description }) => ({
            value: id,
            title: name,
            description,
            attributes: { "data-color-scheme": id, "data-theme-mode": previewThemeMode },
            preview: <SchemePreview scheme={id} mode={previewThemeMode} />,
          }))}
        />
      );
    case "statusBar":
      return (
        <Switch
          id="setting-statusBar"
          checked={appearance.showStatusBar}
          onCheckedChange={(showStatusBar) => setAppearance({ showStatusBar })}
        />
      );
    case "fontSize":
      return (
        <FontSizeStepper
          value={appearance.editorFontSize}
          onChange={(editorFontSize) => setAppearance({ editorFontSize })}
        />
      );
    case "lineSpacing":
      return (
        <SegmentedControl
          label="Editor line spacing"
          value={appearance.editorLineHeight}
          options={LINE_SPACINGS}
          onChange={(editorLineHeight) => setAppearance({ editorLineHeight })}
        />
      );
    case "wordWrap":
      return (
        <Switch id="setting-wordWrap" checked={editor.wordWrap} onCheckedChange={(wordWrap) => setEditor({ wordWrap })} />
      );
    case "lineNumbers":
      return (
        <Switch
          id="setting-lineNumbers"
          checked={editor.lineNumbers}
          onCheckedChange={(lineNumbers) => setEditor({ lineNumbers })}
        />
      );
    case "activeLine":
      return (
        <Switch
          id="setting-activeLine"
          checked={editor.highlightActiveLine}
          onCheckedChange={(highlightActiveLine) => setEditor({ highlightActiveLine })}
        />
      );
    case "focusDimming":
      return (
        <Switch
          id="setting-focusDimming"
          checked={editor.focusDimming}
          onCheckedChange={(focusDimming) => setEditor({ focusDimming })}
        />
      );
    case "previewScale":
      return (
        <Select
          value={String(appearance.previewFontScale)}
          onValueChange={(next) => setAppearance({ previewFontScale: Number(next) })}
        >
          <SelectTrigger id="setting-previewScale" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_SCALE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "lineWidth":
      return (
        <SegmentedControl
          label="Line width"
          value={preview.contentWidth}
          options={CONTENT_WIDTHS}
          onChange={(contentWidth) => setPreview({ contentWidth })}
        />
      );
    case "syncScroll":
      return (
        <Switch
          id="setting-syncScroll"
          aria-describedby="setting-syncScroll-description"
          checked={preview.syncScroll}
          onCheckedChange={(syncScroll) => setPreview({ syncScroll })}
        />
      );
    case "openLinks":
      return (
        <Switch
          id="setting-openLinks"
          aria-describedby="setting-openLinks-description"
          checked={preview.openLinksExternally}
          onCheckedChange={(openLinksExternally) => setPreview({ openLinksExternally })}
        />
      );
    case "autosave":
      return (
        <Switch
          id="setting-autosave"
          aria-describedby="setting-autosave-description"
          checked={files.autosave}
          onCheckedChange={(autosave) => setFiles({ autosave })}
        />
      );
    case "saveFolder":
      return onPickFolder ? (
        <SaveFolderControl
          folder={files.defaultSaveFolder}
          onChange={(defaultSaveFolder) => setFiles({ defaultSaveFolder })}
          onPickFolder={onPickFolder}
          folderExists={folderExists}
        />
      ) : null;
    case "restoreSession":
      return (
        <Switch
          id="setting-restoreSession"
          aria-describedby="setting-restoreSession-description"
          checked={files.restorePreviousSession}
          onCheckedChange={(restorePreviousSession) => setFiles({ restorePreviousSession })}
        />
      );
    case "confirmClose":
      return (
        <Switch
          id="setting-confirmClose"
          checked={files.confirmOnUnsavedClose}
          onCheckedChange={(confirmOnUnsavedClose) => setFiles({ confirmOnUnsavedClose })}
        />
      );
    default:
      return null;
  }
}
