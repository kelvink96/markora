import type {
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  MarkoraSettings,
} from "../../features/settings/settings-schema";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AboutSettingsSection } from "./about-settings-section";
import { AdvancedSettingsSection } from "./advanced-settings-section";
import { AppearanceSettingsSection } from "./appearance-settings-section";
import { EditorSettingsSection } from "./editor-settings-section";
import { FilesSettingsSection } from "./files-settings-section";
import { DEFAULT_SETTINGS_SECTION } from "./settings-navigation";
import { getSystemThemeMode } from "./settings-page-shared";
import type { SettingsSection } from "./settings-page-types";
import { PreviewSettingsSection } from "./preview-settings-section";
import { SettingsSidebar } from "./settings-sidebar";
import { TemplateSettingsSection } from "./template-settings-section";

interface SettingsPageProps {
  settings: MarkoraSettings;
  templateDraft: string;
  version: string;
  onClose: () => void;
  onSaveAppearance: (appearance: AppearanceSettings) => void;
  onSaveEditor: (editor: EditorSettings) => void;
  onSaveFiles: (files: FileSettings) => void;
  onSaveTemplate: (value: string) => void;
  onResetTemplate: () => void;
  onResetAll: () => void;
}

export function SettingsPage({
  settings,
  templateDraft,
  version,
  onClose,
  onSaveAppearance,
  onSaveEditor,
  onSaveFiles,
  onSaveTemplate,
  onResetTemplate,
  onResetAll,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(DEFAULT_SETTINGS_SECTION);
  const [appearanceDraft, setAppearanceDraft] = useState(settings.appearance);
  const [editorDraft, setEditorDraft] = useState(settings.editor);
  const [filesDraft, setFilesDraft] = useState(settings.files);
  const [templateDraftValue, setTemplateDraftValue] = useState(templateDraft);
  const [systemThemeMode, setSystemThemeMode] = useState<"light" | "dark">(getSystemThemeMode);

  useEffect(() => {
    setAppearanceDraft(settings.appearance);
    setEditorDraft(settings.editor);
    setFilesDraft(settings.files);
  }, [settings]);

  useEffect(() => {
    setTemplateDraftValue(templateDraft);
  }, [templateDraft]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemThemeMode(event.matches ? "dark" : "light");
    };

    setSystemThemeMode(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const previewThemeMode = appearanceDraft.theme === "system" ? systemThemeMode : appearanceDraft.theme;
  const sectionContent: Record<SettingsSection, ReactNode> = {
    appearance: (
      <AppearanceSettingsSection
        appearance={appearanceDraft}
        savedAppearance={settings.appearance}
        previewThemeMode={previewThemeMode}
        onAppearanceChange={setAppearanceDraft}
        onSave={onSaveAppearance}
      />
    ),
    preview: <PreviewSettingsSection />,
    editor: (
      <EditorSettingsSection
        editor={editorDraft}
        savedEditor={settings.editor}
        onEditorChange={setEditorDraft}
        onSave={onSaveEditor}
      />
    ),
    files: (
      <FilesSettingsSection
        files={filesDraft}
        savedFiles={settings.files}
        onFilesChange={setFilesDraft}
        onSave={onSaveFiles}
      />
    ),
    about: <AboutSettingsSection version={version} />,
    template: (
      <TemplateSettingsSection
        templateDraft={templateDraftValue}
        onTemplateChange={setTemplateDraftValue}
        onSave={onSaveTemplate}
        onReset={onResetTemplate}
      />
    ),
    advanced: <AdvancedSettingsSection onResetAll={onResetAll} />,
  };

  return (
    <section className="h-full min-h-0 p-4" aria-label="Settings">
      <div className="grid h-full min-h-0 grid-cols-[18rem_minmax(0,1fr)] gap-4">
        <SettingsSidebar
          activeSection={activeSection}
          onClose={onClose}
          onSectionChange={setActiveSection}
        />
        <div className="min-h-0 overflow-auto">{sectionContent[activeSection]}</div>
      </div>
    </section>
  );
}
