import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETTING_SECTIONS, type SettingSection } from "./settings-catalog";
import { SECTION_ICONS } from "./settings-navigation";
import { SidebarButton } from "./settings-page-shared";

interface SettingsSidebarProps {
  activeSection: SettingSection;
  /** Hidden while searching, when the page no longer shows every section. */
  showJumpList: boolean;
  onClose: () => void;
  onJump: (section: SettingSection) => void;
}

export function SettingsSidebar({ activeSection, showJumpList, onClose, onJump }: SettingsSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col gap-4 md:h-full md:overflow-auto">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
      </div>

      {showJumpList ? (
        <nav aria-label="Settings sections" className="flex flex-wrap gap-1 md:block md:space-y-1">
          {SETTING_SECTIONS.map((section) => (
            <SidebarButton
              key={section.id}
              icon={SECTION_ICONS[section.id]}
              iconTestId={`settings-tab-icon-${section.id}`}
              label={section.title}
              isActive={activeSection === section.id}
              onClick={() => onJump(section.id)}
            />
          ))}
        </nav>
      ) : null}

      <div className="md:mt-auto">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft data-testid="settings-back-icon" aria-hidden="true" />
          Back to editor
        </Button>
      </div>
    </aside>
  );
}
