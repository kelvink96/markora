import type { EditorSettings } from "../../features/settings/settings-schema";
import { Checkbox } from "../shared/checkbox";
import {
  SectionActions,
  SectionCard,
  hasChanges,
} from "./settings-page-shared";

interface EditorSettingsSectionProps {
  editor: EditorSettings;
  savedEditor: EditorSettings;
  onEditorChange: (editor: EditorSettings) => void;
  onSave: (editor: EditorSettings) => void;
}

export function EditorSettingsSection({
  editor,
  savedEditor,
  onEditorChange,
  onSave,
}: EditorSettingsSectionProps) {
  return (
    <SectionCard
      title="Editor"
      description="Tune the writing surface and keep technical chrome optional."
    >
      <Checkbox
        label="Show line numbers"
        checked={editor.lineNumbers}
        onChange={(event) =>
          onEditorChange({ ...editor, lineNumbers: event.target.checked })
        }
      />
      <SectionActions
        canSave={hasChanges(editor, savedEditor)}
        onSave={() => onSave(editor)}
      />
    </SectionCard>
  );
}
