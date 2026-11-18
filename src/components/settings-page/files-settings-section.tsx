import type { FileSettings } from "../../features/settings/settings-schema";
import { Switch } from "@/components/ui/switch";
import { SectionActions, SectionCard, SettingRow, hasChanges } from "./settings-page-shared";

interface FilesSettingsSectionProps {
  files: FileSettings;
  savedFiles: FileSettings;
  onFilesChange: (files: FileSettings) => void;
  onSave: (files: FileSettings) => void;
  /** Desktop only: on web the workspace is already kept in the browser. */
  canRestoreSession?: boolean;
}

export function FilesSettingsSection({
  files,
  savedFiles,
  onFilesChange,
  onSave,
  canRestoreSession = false,
}: FilesSettingsSectionProps) {
  return (
    <SectionCard
      title="Files"
      description="Control document safety prompts and other desktop file behaviors."
    >
      <SettingRow
        controlId="files-autosave"
        label="Save changes automatically"
        description="Saves a moment after you stop typing. Untitled documents are skipped until you save them once."
      >
        <Switch
          id="files-autosave"
          aria-describedby="files-autosave-description"
          checked={files.autosave}
          onCheckedChange={(autosave) => onFilesChange({ ...files, autosave })}
        />
      </SettingRow>
      {canRestoreSession ? (
        <SettingRow
          controlId="files-restore-session"
          label="Reopen last session's files on launch"
          description="Brings back the saved files you had open, and the one you were on."
        >
          <Switch
            id="files-restore-session"
            aria-describedby="files-restore-session-description"
            checked={files.restorePreviousSession}
            onCheckedChange={(restorePreviousSession) => onFilesChange({ ...files, restorePreviousSession })}
          />
        </SettingRow>
      ) : null}
      <SettingRow controlId="files-confirm-close" label="Confirm before closing unsaved tabs">
        <Switch
          id="files-confirm-close"
          checked={files.confirmOnUnsavedClose}
          onCheckedChange={(confirmOnUnsavedClose) => onFilesChange({ ...files, confirmOnUnsavedClose })}
        />
      </SettingRow>
      <SectionActions canSave={hasChanges(files, savedFiles)} onSave={() => onSave(files)} />
    </SectionCard>
  );
}
