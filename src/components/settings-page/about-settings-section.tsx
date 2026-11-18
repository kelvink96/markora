import { SectionCard } from "./settings-page-shared";

interface AboutSettingsSectionProps {
  version: string;
  privacyPolicyUrl: string;
}

export function AboutSettingsSection({ version, privacyPolicyUrl }: AboutSettingsSectionProps) {
  return (
    <SectionCard title="About" description="Current app details and the stack behind Markora.">
      <div className="space-y-2 text-sm">
        <p>Markora is a desktop-first markdown editor.</p>
        <p className="text-muted-foreground">{`Version ${version}`}</p>
        <p className="text-muted-foreground">Built with Tauri, Rust, React, TypeScript, and CodeMirror 6.</p>
        <a
          href={privacyPolicyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-primary underline underline-offset-4"
        >
          Privacy Policy
        </a>
      </div>
    </SectionCard>
  );
}
