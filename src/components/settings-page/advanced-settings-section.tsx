import { AlertTriangle } from "lucide-react";
import { Button } from "../shared/button";
import { SectionCard } from "./settings-page-shared";

interface AdvancedSettingsSectionProps {
  onResetAll: () => void;
}

export function AdvancedSettingsSection({
  onResetAll,
}: AdvancedSettingsSectionProps) {
  return (
    <SectionCard
      title="Advanced"
      description="Use reset carefully. This restores both app preferences and authoring defaults."
    >
      <Button
        variant="danger"
        leftSection={<AlertTriangle data-testid="settings-danger-icon" className="size-4" />}
        onClick={() => {
          if (window.confirm("Reset all settings to their defaults?")) {
            onResetAll();
          }
        }}
      >
        Reset all settings
      </Button>
    </SectionCard>
  );
}
