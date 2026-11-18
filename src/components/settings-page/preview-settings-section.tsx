import type { PreviewSettings } from "../../features/settings/settings-schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SectionCard, SettingRow } from "./settings-page-shared";

const CONTENT_WIDTHS: Array<{ value: PreviewSettings["contentWidth"]; label: string }> = [
  { value: "narrow", label: "Narrow (60 characters)" },
  { value: "normal", label: "Normal (72 characters)" },
  { value: "wide", label: "Wide (90 characters)" },
];

interface PreviewSettingsSectionProps {
  preview: PreviewSettings;
  /** Called with the full new settings on every change; the caller applies and saves them straight away. */
  onChange: (preview: PreviewSettings) => void;
}

export function PreviewSettingsSection({ preview, onChange }: PreviewSettingsSectionProps) {
  return (
    <SectionCard
      title="Preview"
      description="Control how the rendered preview reads and behaves next to the editor."
    >
      <SettingRow controlId="preview-content-width" label="Line width">
        <Select
          value={preview.contentWidth}
          onValueChange={(contentWidth) =>
            onChange({ ...preview, contentWidth: contentWidth as PreviewSettings["contentWidth"] })
          }
        >
          <SelectTrigger id="preview-content-width" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_WIDTHS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow
        controlId="preview-sync-scroll"
        label="Scroll the editor and preview together"
        description="Applies whenever the editor and preview are side by side."
      >
        <Switch
          id="preview-sync-scroll"
          aria-describedby="preview-sync-scroll-description"
          checked={preview.syncScroll}
          onCheckedChange={(syncScroll) => onChange({ ...preview, syncScroll })}
        />
      </SettingRow>
      <SettingRow
        controlId="preview-open-links"
        label="Open links in your browser"
        description="When off, links in the preview do nothing, so you can't leave your document by accident."
      >
        <Switch
          id="preview-open-links"
          aria-describedby="preview-open-links-description"
          checked={preview.openLinksExternally}
          onCheckedChange={(openLinksExternally) => onChange({ ...preview, openLinksExternally })}
        />
      </SettingRow>
    </SectionCard>
  );
}
