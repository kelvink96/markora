import type { FileSettings } from "../../features/settings/settings-schema";
import { Checkbox } from "../shared/checkbox";
import {
  SectionActions,
  SectionCard,
  hasChanges,
} from "./settings-page-shared";

interface FilesSettingsSectionProps {
  files: FileSettings;
  savedFiles: FileSettings;
  onFilesChange: (files: FileSettings) => void;
  onSave: (files: FileSettings) => void;
}

export function FilesSettingsSection({
  files,
  savedFiles,
  onFilesChange,
  onSave,
}: FilesSettingsSectionProps) {
  return (
    <SectionCard
      title="Files"
      description="Control document safety prompts and other desktop file behaviors."
    >
      <Checkbox
        label="Confirm before closing unsaved tabs"
        checked={files.confirmOnUnsavedClose}
        onChange={(event) =>
          onFilesChange({
            ...files,
            confirmOnUnsavedClose: event.target.checked,
          })
        }
      />
      <SectionActions
        canSave={hasChanges(files, savedFiles)}
        onSave={() => onSave(files)}
      />
    </SectionCard>
  );
}
