import type { EditorSettings } from "../../features/settings/settings-schema";
import { Switch } from "@/components/ui/switch";
import { SectionActions, SectionCard, SettingRow, hasChanges } from "./settings-page-shared";

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
      <SettingRow controlId="editor-line-numbers" label="Show line numbers">
        <Switch
          id="editor-line-numbers"
          checked={editor.lineNumbers}
          onCheckedChange={(lineNumbers) => onEditorChange({ ...editor, lineNumbers })}
        />
      </SettingRow>
      <SettingRow controlId="editor-word-wrap" label="Wrap long lines">
        <Switch
          id="editor-word-wrap"
          checked={editor.wordWrap}
          onCheckedChange={(wordWrap) => onEditorChange({ ...editor, wordWrap })}
        />
      </SettingRow>
      <SettingRow controlId="editor-active-line" label="Highlight the current line">
        <Switch
          id="editor-active-line"
          checked={editor.highlightActiveLine}
          onCheckedChange={(highlightActiveLine) => onEditorChange({ ...editor, highlightActiveLine })}
        />
      </SettingRow>
      <SectionActions canSave={hasChanges(editor, savedEditor)} onSave={() => onSave(editor)} />
    </SectionCard>
  );
}
