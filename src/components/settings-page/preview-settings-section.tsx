import { Text } from "../shared/text";
import { SectionCard } from "./settings-page-shared";

export function PreviewSettingsSection() {
  return (
    <SectionCard
      title="Preview"
      description="Preview content fills the pane and inherits the active app color scheme."
    >
      <Text tone="muted">
        Preview content uses the full available width of the pane.
      </Text>
      <Text tone="muted">
        Use Appearance to switch app color schemes and compare the shell presets visually.
      </Text>
    </SectionCard>
  );
}
