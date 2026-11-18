import type { FileSettings } from "../../features/settings/settings-schema";
import { Switch } from "@/components/ui/switch";
import { SectionCard, SettingRow } from "./settings-page-shared";

interface FilesSettingsSectionProps {
  files: FileSettings;
  /** Called with the full new settings on every change; the caller applies and saves them straight away. */
  onChange: (files: FileSettings) => void;
  /** Desktop only: on web the workspace is already kept in the browser. */
  canRestoreSession?: boolean;
}

export function FilesSettingsSection({
  files,
  onChange,
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
          onCheckedChange={(autosave) => onChange({ ...files, autosave })}
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
            onCheckedChange={(restorePreviousSession) => onChange({ ...files, restorePreviousSession })}
          />
        </SettingRow>
      ) : null}
      <SettingRow controlId="files-confirm-close" label="Confirm before closing unsaved tabs">
        <Switch
          id="files-confirm-close"
          checked={files.confirmOnUnsavedClose}
          onCheckedChange={(confirmOnUnsavedClose) => onChange({ ...files, confirmOnUnsavedClose })}
        />
      </SettingRow>
    </SectionCard>
  );
}
