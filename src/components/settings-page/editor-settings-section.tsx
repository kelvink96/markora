import type { EditorSettings } from "../../features/settings/settings-schema";
import { Switch } from "@/components/ui/switch";
import { SectionCard, SettingRow } from "./settings-page-shared";

interface EditorSettingsSectionProps {
  editor: EditorSettings;
  /** Called with the full new settings on every change; the caller applies and saves them straight away. */
  onChange: (editor: EditorSettings) => void;
}

export function EditorSettingsSection({ editor, onChange }: EditorSettingsSectionProps) {
  return (
    <SectionCard
      title="Editor"
      description="Tune the writing surface and keep technical chrome optional."
    >
      <SettingRow controlId="editor-line-numbers" label="Show line numbers">
        <Switch
          id="editor-line-numbers"
          checked={editor.lineNumbers}
          onCheckedChange={(lineNumbers) => onChange({ ...editor, lineNumbers })}
        />
      </SettingRow>
      <SettingRow controlId="editor-word-wrap" label="Wrap long lines">
        <Switch
          id="editor-word-wrap"
          checked={editor.wordWrap}
          onCheckedChange={(wordWrap) => onChange({ ...editor, wordWrap })}
        />
      </SettingRow>
      <SettingRow controlId="editor-active-line" label="Highlight the current line">
        <Switch
          id="editor-active-line"
          checked={editor.highlightActiveLine}
          onCheckedChange={(highlightActiveLine) => onChange({ ...editor, highlightActiveLine })}
        />
      </SettingRow>
    </SectionCard>
  );
}
