import { Text } from "../shared/text";
import { SectionCard } from "./settings-page-shared";

interface AboutSettingsSectionProps {
  version: string;
}

export function AboutSettingsSection({ version }: AboutSettingsSectionProps) {
  return (
    <SectionCard
      title="About"
      description="Current app details and the stack behind Markora."
    >
      <Text>Markora is a desktop-first markdown editor.</Text>
      <Text tone="muted">{`Version ${version}`}</Text>
      <Text tone="muted">
        Built with Tauri, Rust, React, TypeScript, and CodeMirror 6.
      </Text>
    </SectionCard>
  );
}
