import type { ColorScheme } from "../../features/settings/settings-schema";
import type { SettingsSection } from "./settings-page-types";
import { SETTINGS_NAVIGATION_GROUPS } from "./settings-navigation";
import { SidebarButton } from "./settings-page-shared";
import { Button } from "../shared/button";
import { Card } from "../shared/card";
import { Text } from "../shared/text";
import { Title } from "../shared/title";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  colorScheme: ColorScheme;
  onClose: () => void;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({
  activeSection,
  colorScheme,
  onClose,
  onSectionChange,
}: SettingsSidebarProps) {
  const isHighContrast = colorScheme === "high-contrast";

  return (
    <Card
      as="aside"
      className="flex h-full min-h-0 flex-col rounded-app-sm bg-[color:var(--glass-panel)] p-4 backdrop-blur-[var(--glass-blur-soft)]"
    >
      <div className="mb-5">
        <Title as="h2">Settings</Title>
        <Text tone="muted">Tune Markora for your writing flow.</Text>
      </div>

      <div className="space-y-5">
        {SETTINGS_NAVIGATION_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <Text
              as="h3"
              size="xs"
              weight="semibold"
              className="uppercase tracking-[0.16em] text-app-text/50"
            >
              {group.title}
            </Text>
            {group.items.map((item) => (
              <SidebarButton
                key={item.id}
                label={item.label}
                isHighContrast={isHighContrast}
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-start pt-4">
        <Button onClick={onClose}>
          Back to editor
        </Button>
      </div>
    </Card>
  );
}
