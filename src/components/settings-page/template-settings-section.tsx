import type { ChangeEvent } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "../shared/button";
import { FieldLabel, SectionCard } from "./settings-page-shared";

interface TemplateSettingsSectionProps {
  templateDraft: string;
  onReset: () => void;
  onSave: (value: string) => void;
  onTemplateChange: (value: string) => void;
}

export function TemplateSettingsSection({
  templateDraft,
  onReset,
  onSave,
  onTemplateChange,
}: TemplateSettingsSectionProps) {
  return (
    <SectionCard
      title="New Document Template"
      description="This content is used only for newly created documents."
    >
      <FieldLabel htmlFor="template-content">Template content</FieldLabel>
      <textarea
        id="template-content"
        className="min-h-64 w-full rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-4 py-3 font-mono text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)]"
        value={templateDraft}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onTemplateChange(event.target.value)
        }
      />
      <div className="flex flex-wrap gap-3">
        <Button
          leftSection={<Save data-testid="settings-save-icon" className="size-4" />}
          onClick={() => onSave(templateDraft)}
        >
          Save template
        </Button>
        <Button
          variant="ghost"
          leftSection={<RotateCcw data-testid="settings-reset-icon" className="size-4" />}
          onClick={onReset}
        >
          Reset template
        </Button>
      </div>
    </SectionCard>
  );
}
