import type { ChangeEvent } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "./settings-page-shared";

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
      <div className="space-y-2">
        <Label htmlFor="template-content">Template content</Label>
        <Textarea
          id="template-content"
          className="min-h-64 font-mono"
          value={templateDraft}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onTemplateChange(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onSave(templateDraft)}>
          <Save data-testid="settings-save-icon" aria-hidden="true" />
          Save template
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw data-testid="settings-reset-icon" aria-hidden="true" />
          Reset template
        </Button>
      </div>
    </SectionCard>
  );
}
