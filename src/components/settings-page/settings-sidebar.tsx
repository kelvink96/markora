import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SettingsSection } from "./settings-page-types";
import { SETTINGS_NAVIGATION_GROUPS } from "./settings-navigation";
import { SidebarButton } from "./settings-page-shared";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onClose: () => void;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({ activeSection, onClose, onSectionChange }: SettingsSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-auto rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Tune Markora for your writing flow.</p>
      </div>

      <nav aria-label="Settings sections" className="space-y-5">
        {SETTINGS_NAVIGATION_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {group.title}
            </h3>
            {group.items.map((item) => (
              <SidebarButton
                key={item.id}
                icon={item.icon}
                iconTestId={`settings-tab-icon-${item.id}`}
                label={item.label}
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft data-testid="settings-back-icon" aria-hidden="true" />
          Back to editor
        </Button>
      </div>
    </aside>
  );
}
