import type { PreviewSettings } from "../../features/settings/settings-schema";
import { Checkbox } from "../shared/checkbox";
import { Select } from "../shared/select";
import {
  SectionActions,
  SectionCard,
  hasChanges,
} from "./settings-page-shared";

const CONTENT_WIDTHS: Array<{ value: PreviewSettings["contentWidth"]; label: string }> = [
  { value: "narrow", label: "Narrow (60 characters)" },
  { value: "normal", label: "Normal (72 characters)" },
  { value: "wide", label: "Wide (90 characters)" },
];

interface PreviewSettingsSectionProps {
  preview: PreviewSettings;
  savedPreview: PreviewSettings;
  onPreviewChange: (preview: PreviewSettings) => void;
  onSave: (preview: PreviewSettings) => void;
}

export function PreviewSettingsSection({
  preview,
  savedPreview,
  onPreviewChange,
  onSave,
}: PreviewSettingsSectionProps) {
  return (
    <SectionCard
      title="Preview"
      description="Control how the rendered preview reads and behaves next to the editor."
    >
      <Select
        id="preview-content-width"
        label="Line width"
        value={preview.contentWidth}
        onChange={(event) =>
          onPreviewChange({
            ...preview,
            contentWidth: event.target.value as PreviewSettings["contentWidth"],
          })
        }
      >
        {CONTENT_WIDTHS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div>
        <Checkbox
          label="Scroll the editor and preview together"
          aria-describedby="sync-scroll-help"
          checked={preview.syncScroll}
          onChange={(event) =>
            onPreviewChange({ ...preview, syncScroll: event.target.checked })
          }
        />
        <p id="sync-scroll-help" className="ml-[1.875rem] mt-1 text-xs text-app-text/60">
          Only in split view.
        </p>
      </div>
      <div>
        <Checkbox
          label="Open links in your browser"
          aria-describedby="open-links-help"
          checked={preview.openLinksExternally}
          onChange={(event) =>
            onPreviewChange({ ...preview, openLinksExternally: event.target.checked })
          }
        />
        <p id="open-links-help" className="ml-[1.875rem] mt-1 text-xs text-app-text/60">
          When off, links in the preview do nothing, so you can't leave your document by accident.
        </p>
      </div>
      <SectionActions
        canSave={hasChanges(preview, savedPreview)}
        onSave={() => onSave(preview)}
      />
    </SectionCard>
  );
}
