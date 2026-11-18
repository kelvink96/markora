import type {
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  MarkoraSettings,
  PreviewSettings,
} from "../../features/settings/settings-schema";
import type { ReactNode } from "react";
import { AboutSettingsSection } from "./about-settings-section";
import { AdvancedSettingsSection } from "./advanced-settings-section";
import { AppearanceSettingsSection } from "./appearance-settings-section";
import { EditorSettingsSection } from "./editor-settings-section";
import { FilesSettingsSection } from "./files-settings-section";
import { PreviewSettingsSection } from "./preview-settings-section";
import type { SettingsSection } from "./settings-page-types";
import { SettingsSidebar } from "./settings-sidebar";
import { TemplateSettingsSection } from "./template-settings-section";
import { useSettingsPageState } from "./use-settings-page-state";

interface SettingsPageProps {
  settings: MarkoraSettings;
  templateDraft: string;
  version: string;
  onClose: () => void;
  onSaveAppearance: (appearance: AppearanceSettings) => void;
  onSaveEditor: (editor: EditorSettings) => void;
  onSaveFiles: (files: FileSettings) => void;
  onSavePreview: (preview: PreviewSettings) => void;
  onSaveTemplate: (value: string) => void;
  onResetTemplate: () => void;
  onResetAll: () => void;
  /** Desktop only: shows the "reopen last session" option. */
  canRestoreSession?: boolean;
}

export function SettingsPage({
  settings,
  templateDraft,
  version,
  onClose,
  onSaveAppearance,
  onSaveEditor,
  onSaveFiles,
  onSavePreview,
  onSaveTemplate,
  onResetTemplate,
  onResetAll,
  canRestoreSession = false,
}: SettingsPageProps) {
  const {
    activeSection,
    appearanceDraft,
    editorDraft,
    filesDraft,
    previewDraft,
    previewThemeMode,
    setActiveSection,
    setAppearanceDraft,
    setEditorDraft,
    setFilesDraft,
    setPreviewDraft,
    setTemplateDraftValue,
    templateDraftValue,
  } = useSettingsPageState({
    settings,
    templateDraft,
  });
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
    editor: (
      <EditorSettingsSection
        editor={editorDraft}
        savedEditor={settings.editor}
        onEditorChange={setEditorDraft}
        onSave={onSaveEditor}
      />
    ),
    preview: (
      <PreviewSettingsSection
        preview={previewDraft}
        savedPreview={settings.preview}
        onPreviewChange={setPreviewDraft}
        onSave={onSavePreview}
      />
    ),
    files: (
      <FilesSettingsSection
        files={filesDraft}
        savedFiles={settings.files}
        onFilesChange={setFilesDraft}
        onSave={onSaveFiles}
        canRestoreSession={canRestoreSession}
      />
    ),
    about: (
      <AboutSettingsSection
        version={version}
        privacyPolicyUrl="https://kelvink96.github.io/markora/privacy"
      />
    ),
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
      <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 md:grid-cols-[16rem_minmax(0,1fr)] md:grid-rows-1">
        <SettingsSidebar
          activeSection={activeSection}
          onClose={onClose}
          onSectionChange={setActiveSection}
        />
        <div className="min-h-0 overflow-auto">
          <div className="w-full max-w-3xl pb-6">{sectionContent[activeSection]}</div>
        </div>
      </div>
    </section>
  );
}
