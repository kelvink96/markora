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
      <div>
        <Checkbox
          label="Save changes automatically"
          aria-describedby="autosave-help"
          checked={files.autosave}
          onChange={(event) =>
            onFilesChange({
              ...files,
              autosave: event.target.checked,
            })
          }
        />
        <p id="autosave-help" className="ml-[1.875rem] mt-1 text-xs text-app-text/60">
          Saves a moment after you stop typing. Untitled documents are skipped until you save them once.
        </p>
      </div>
      {canRestoreSession ? (
        <div>
          <Checkbox
            label="Reopen last session's files on launch"
            aria-describedby="restore-session-help"
            checked={files.restorePreviousSession}
            onChange={(event) =>
              onFilesChange({
                ...files,
                restorePreviousSession: event.target.checked,
              })
            }
          />
          <p id="restore-session-help" className="ml-[1.875rem] mt-1 text-xs text-app-text/60">
            Brings back the saved files you had open, and the one you were on.
          </p>
        </div>
      ) : null}
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
