import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import type {
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  MarkoraSettings,
  PreviewSettings,
} from "../../features/settings/settings-schema";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { renderControl } from "./setting-controls";
import {
  SETTING_SECTIONS,
  SETTINGS_CATALOG,
  filterSettings,
  type SettingDefinition,
  type SettingSection,
} from "./settings-catalog";
import { SettingRow, SettingsGroup } from "./settings-page-shared";
import { detectPlatform } from "../../platform/runtime";
import { selectHasUnsavedChanges, useDocumentStore } from "../../store/document";
import { SettingsFooter } from "./settings-footer";
import { UpdatesCard } from "./updates-card";
import { SettingsSidebar } from "./settings-sidebar";
import { TemplateDialog } from "./template-dialog";
import { useSettingsPageState } from "./use-settings-page-state";

const PRIVACY_POLICY_URL = "https://kelvink96.github.io/markora/privacy";

interface SettingsPageProps {
  settings: MarkoraSettings;
  /** The saved new-document template; the template dialog starts from it. */
  templateDraft: string;
  version: string;
  onClose: () => void;
  /** These four apply and persist on every change; only the template dialog keeps an explicit Save. */
  onChangeAppearance: (appearance: AppearanceSettings) => void;
  onChangeEditor: (editor: EditorSettings) => void;
  onChangeFiles: (files: FileSettings) => void;
  onChangePreview: (preview: PreviewSettings) => void;
  onSaveTemplate: (value: string) => void;
  onResetAll: () => void;
  /** Desktop only: called after the automatic update check preference changes, to persist it. */
  onChangeUpdates?: () => void;
  /** Desktop only: shows the "reopen last session" option. */
  canRestoreSession?: boolean;
}

function isTextField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Settings whose control is a group or composite, so there is no single element for a label to point at. */
const UNLABELABLE_SETTINGS = new Set(["theme", "colorScheme", "fontSize", "lineSpacing", "lineWidth", "template"]);

const sectionElementId = (section: SettingSection) => `settings-section-${section}`;

export function SettingsPage({
  settings,
  templateDraft,
  version,
  onClose,
  onChangeAppearance,
  onChangeEditor,
  onChangeFiles,
  onChangePreview,
  onSaveTemplate,
  onResetAll,
  onChangeUpdates,
  canRestoreSession = false,
}: SettingsPageProps) {
  const { activeSection, previewThemeMode, query, setActiveSection, setQuery } = useSettingsPageState({
    settings,
  });
  const hasUnsavedChanges = useDocumentStore(selectHasUnsavedChanges);
  const searchRef = useRef<HTMLInputElement>(null);
  const isSearching = query.trim().length > 0;
  const visible = filterSettings(SETTINGS_CATALOG, query, { desktop: canRestoreSession });

  const countLabel = `${visible.length} ${visible.length === 1 ? "setting" : "settings"}`;
  const resultsSummary =
    visible.length === 0
      ? `No settings match "${query.trim()}".`
      : isSearching
        ? `${countLabel} found`
        : countLabel;

  // Routes a full new settings object to the handler of whichever group changed.
  const update = (next: MarkoraSettings) => {
    if (next.appearance !== settings.appearance) onChangeAppearance(next.appearance);
    if (next.editor !== settings.editor) onChangeEditor(next.editor);
    if (next.preview !== settings.preview) onChangePreview(next.preview);
    if (next.files !== settings.files) onChangeFiles(next.files);
  };

  useEffect(() => {
    const focusSearchOnSlash = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTextField(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearchOnSlash);
    return () => window.removeEventListener("keydown", focusSearchOnSlash);
  }, []);

  // Track which group is at the top of the page so the jump list can highlight it.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || isSearching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.find((entry) => entry.isIntersecting);
        const section = SETTING_SECTIONS.find((candidate) => sectionElementId(candidate.id) === top?.target.id);
        if (section) setActiveSection(section.id);
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    for (const section of SETTING_SECTIONS) {
      const element = document.getElementById(sectionElementId(section.id));
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [isSearching, setActiveSection]);

  const jumpTo = (section: SettingSection) => {
    setActiveSection(section);
    document.getElementById(sectionElementId(section))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderRow = (definition: SettingDefinition) => {
    const isTemplate = definition.id === "template";
    const stacked = definition.id === "theme" || definition.id === "colorScheme";
    return (
      <SettingRow
        key={definition.id}
        controlId={`setting-${definition.id}`}
        label={definition.label}
        description={definition.description}
        stacked={stacked}
        labelable={!UNLABELABLE_SETTINGS.has(definition.id)}
        changed={definition.isChanged(settings)}
        onReset={() => update(definition.reset(settings))}
      >
        {isTemplate ? (
          <TemplateDialog template={templateDraft} onSave={onSaveTemplate} />
        ) : (
          renderControl(definition.id, { settings, previewThemeMode, update })
        )}
      </SettingRow>
    );
  };

  return (
    <section className="h-full min-h-0 p-4" aria-label="Settings">
      <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 md:grid-cols-[12rem_minmax(0,1fr)] md:grid-rows-1 md:gap-8">
        <SettingsSidebar
          activeSection={activeSection}
          showJumpList={!isSearching}
          onClose={onClose}
          onJump={jumpTo}
        />
        <div className="min-h-0 overflow-auto">
          <div className="mx-auto w-full max-w-3xl pb-6">
            <div className="sticky top-0 z-10 -mx-1 bg-background/90 px-1 pt-1 pb-3 backdrop-blur-sm">
              <InputGroup>
                <InputGroupInput
                  ref={searchRef}
                  type="search"
                  aria-label="Search settings"
                  placeholder="Search settings…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && query) {
                      event.preventDefault();
                      setQuery("");
                    }
                  }}
                />
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Kbd>/</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <p role="status" className="sr-only">
              {resultsSummary}
            </p>
            {visible.length === 0 ? (
              <p aria-hidden="true" className="py-10 text-center text-sm text-muted-foreground">
                {resultsSummary}
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {SETTING_SECTIONS.map((section) => {
                  const rows = visible.filter((definition) => definition.section === section.id);
                  if (rows.length === 0) return null;
                  return (
                    <SettingsGroup key={section.id} id={sectionElementId(section.id)} title={section.title}>
                      {rows.map(renderRow)}
                    </SettingsGroup>
                  );
                })}
              </div>
            )}

            {isSearching ? null : (
              <>
                {detectPlatform() === "desktop" ? (
                  <UpdatesCard
                    version={version}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onChangeUpdates={onChangeUpdates}
                  />
                ) : null}
                <SettingsFooter version={version} privacyPolicyUrl={PRIVACY_POLICY_URL} onResetAll={onResetAll} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
