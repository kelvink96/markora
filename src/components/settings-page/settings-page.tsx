import type {
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  MarkoraSettings,
  PreviewSettings,
  ThemePreference,
} from "../../features/settings/settings-schema";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

type SettingsSection =
  | "appearance"
  | "editor"
  | "preview"
  | "files"
  | "about"
  | "template"
  | "advanced";

interface SettingsPageProps {
  settings: MarkoraSettings;
  templateDraft: string;
  version: string;
  onClose: () => void;
  onSaveAppearance: (appearance: AppearanceSettings) => void;
  onSaveEditor: (editor: EditorSettings) => void;
  onSavePreview: (preview: PreviewSettings) => void;
  onSaveFiles: (files: FileSettings) => void;
  onSaveTemplate: (value: string) => void;
  onResetTemplate: () => void;
  onResetAll: () => void;
}

function SidebarButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-app-sm border border-transparent px-3 py-2 text-left text-sm transition ${
        isActive
          ? "bg-[color:var(--glass-elevated)] text-app-text shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
          : "text-app-text/70 hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass-hover)]"
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({
  description,
  title,
  children,
}: {
  description: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-5 backdrop-blur-[var(--glass-blur-soft)] shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_14px_36px_rgba(0,0,0,0.08)]">
      <header className="mb-4 space-y-1">
        <h3 className="text-base font-semibold text-app-text">{title}</h3>
        <p className="text-sm text-app-text/70">{description}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ReaderThemeSwatch({
  description,
  isSelected,
  onSelect,
  title,
  value,
}: {
  description: string;
  isSelected: boolean;
  onSelect: (value: PreviewSettings["readerTheme"]) => void;
  title: string;
  value: PreviewSettings["readerTheme"];
}) {
  return (
    <button
      type="button"
      data-testid={`reader-swatch-${value}`}
      data-reader-theme={value}
      onClick={() => onSelect(value)}
      className={`preview-reader-theme preview-reader-theme-${value} rounded-app-md border p-3 text-left transition ${
        isSelected
          ? "border-[color:var(--accent-strong)] shadow-[0_0_0_1px_var(--accent-strong)]"
          : "border-[color:var(--glass-border-strong)] hover:border-[color:var(--glass-border)]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs opacity-75">{description}</div>
        </div>
        <div
          className={`h-3 w-3 rounded-full border ${
            isSelected ? "border-current bg-current" : "border-current/50"
          }`}
          aria-hidden="true"
        />
      </div>
      <div className="space-y-2 rounded-app-sm border border-current/10 bg-black/5 p-3">
        <div className="font-[var(--font-prose)] text-sm font-semibold">Heading</div>
        <div className="font-[var(--font-prose)] text-xs opacity-80">
          Comfortable body copy for longer reading sessions.
        </div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span className="h-px flex-1 bg-current/15" />
          <span>blockquote</span>
        </div>
        <div className="inline-block rounded-app-sm bg-black/8 px-2 py-1 font-[var(--font-editor)] text-[11px]">
          code sample
        </div>
      </div>
    </button>
  );
}

function FieldLabel({
  children,
  helper,
  htmlFor,
}: {
  children: ReactNode;
  helper?: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-sm text-app-text">
      <span>{children}</span>
      {helper ? <span className="text-xs text-app-text/60">{helper}</span> : null}
    </label>
  );
}

function SectionActions({
  canSave,
  label = "Save changes",
  onSave,
}: {
  canSave: boolean;
  label?: string;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSave}
        onClick={onSave}
      >
        {label}
      </button>
    </div>
  );
}

function hasChanges<T>(left: T, right: T) {
  return JSON.stringify(left) !== JSON.stringify(right);
}

export function SettingsPage({
  settings,
  templateDraft,
  version,
  onClose,
  onSaveAppearance,
  onSaveEditor,
  onSavePreview,
  onSaveFiles,
  onSaveTemplate,
  onResetTemplate,
  onResetAll,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [appearanceDraft, setAppearanceDraft] = useState(settings.appearance);
  const [editorDraft, setEditorDraft] = useState(settings.editor);
  const [previewDraft, setPreviewDraft] = useState(settings.preview);
  const [filesDraft, setFilesDraft] = useState(settings.files);
  const [templateDraftValue, setTemplateDraftValue] = useState(templateDraft);

  useEffect(() => {
    setAppearanceDraft(settings.appearance);
    setEditorDraft(settings.editor);
    setPreviewDraft(settings.preview);
    setFilesDraft(settings.files);
  }, [settings]);

  useEffect(() => {
    setTemplateDraftValue(templateDraft);
  }, [templateDraft]);

  const renderContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-4">
            <SectionCard
              title="Appearance"
              description="Control the app chrome, shell theme, and supporting interface elements."
            >
              <FieldLabel htmlFor="theme-preference" helper="System follows your OS color scheme.">
                Theme
              </FieldLabel>
              <select
                id="theme-preference"
                className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 backdrop-blur-[var(--glass-blur-soft)]"
                value={appearanceDraft.theme}
                onChange={(event) =>
                  setAppearanceDraft((current) => ({
                    ...current,
                    theme: event.target.value as ThemePreference,
                  }))
                }
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>

              <FieldLabel htmlFor="status-bar-toggle">Show status bar</FieldLabel>
              <label className="inline-flex items-center gap-3 text-sm text-app-text">
                <input
                  id="status-bar-toggle"
                  type="checkbox"
                  checked={appearanceDraft.showStatusBar}
                  onChange={(event) =>
                    setAppearanceDraft((current) => ({
                      ...current,
                      showStatusBar: event.target.checked,
                    }))
                  }
                />
                Keep the footer metrics visible while writing
              </label>
              <SectionActions
                canSave={hasChanges(appearanceDraft, settings.appearance)}
                label="Save appearance"
                onSave={() => onSaveAppearance(appearanceDraft)}
              />
            </SectionCard>

            <SectionCard
              title="Reader Color Scheme"
              description="Choose how the preview reading surface feels without changing the rest of the app."
            >
              <FieldLabel
                htmlFor="reader-color-scheme"
                helper="These presets are wired directly to the preview pane so the swatches match the reading surface."
              >
                Reader color scheme
              </FieldLabel>
              <select
                id="reader-color-scheme"
                className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 backdrop-blur-[var(--glass-blur-soft)]"
                value={previewDraft.readerTheme}
                onChange={(event) =>
                  setPreviewDraft((current) => ({
                    ...current,
                    readerTheme: event.target.value as PreviewSettings["readerTheme"],
                  }))
                }
              >
                <option value="paper">Paper</option>
                <option value="dark">Dark</option>
                <option value="sepia">Sepia</option>
                <option value="high-contrast">High Contrast</option>
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <ReaderThemeSwatch
                  title="Paper"
                  description="Neutral and airy"
                  value="paper"
                  isSelected={previewDraft.readerTheme === "paper"}
                  onSelect={(value) =>
                    setPreviewDraft((current) => ({
                      ...current,
                      readerTheme: value,
                    }))
                  }
                />
                <ReaderThemeSwatch
                  title="Dark"
                  description="Low-glare night reading"
                  value="dark"
                  isSelected={previewDraft.readerTheme === "dark"}
                  onSelect={(value) =>
                    setPreviewDraft((current) => ({
                      ...current,
                      readerTheme: value,
                    }))
                  }
                />
                <ReaderThemeSwatch
                  title="Sepia"
                  description="Warm editorial feel"
                  value="sepia"
                  isSelected={previewDraft.readerTheme === "sepia"}
                  onSelect={(value) =>
                    setPreviewDraft((current) => ({
                      ...current,
                      readerTheme: value,
                    }))
                  }
                />
                <ReaderThemeSwatch
                  title="High Contrast"
                  description="Sharper accessibility-first contrast"
                  value="high-contrast"
                  isSelected={previewDraft.readerTheme === "high-contrast"}
                  onSelect={(value) =>
                    setPreviewDraft((current) => ({
                      ...current,
                      readerTheme: value,
                    }))
                  }
                />
              </div>
              <SectionActions
                canSave={hasChanges(previewDraft, settings.preview)}
                label="Save reader scheme"
                onSave={() => onSavePreview(previewDraft)}
              />
            </SectionCard>
          </div>
        );
      case "preview":
        return (
          <SectionCard
            title="Preview"
            description="Preview content fills the pane, while reader color schemes now live under Appearance."
          >
            <p className="text-sm text-app-text/70">
              Preview content uses the full available width of the pane.
            </p>
            <p className="text-sm text-app-text/70">
              Use Appearance to choose the reader color scheme and compare the presets visually.
            </p>
          </SectionCard>
        );
      case "editor":
        return (
          <SectionCard
            title="Editor"
            description="Tune the writing surface and keep technical chrome optional."
          >
            <label className="inline-flex items-center gap-3 text-sm text-app-text">
              <input
                type="checkbox"
                checked={editorDraft.lineNumbers}
                onChange={(event) =>
                  setEditorDraft((current) => ({
                    ...current,
                    lineNumbers: event.target.checked,
                  }))
                }
                aria-label="Show line numbers"
              />
              Show line numbers
            </label>
            <SectionActions
              canSave={hasChanges(editorDraft, settings.editor)}
              onSave={() => onSaveEditor(editorDraft)}
            />
          </SectionCard>
        );
      case "files":
        return (
          <SectionCard
            title="Files"
            description="Control document safety prompts and other desktop file behaviors."
          >
            <label className="inline-flex items-center gap-3 text-sm text-app-text">
              <input
                type="checkbox"
                checked={filesDraft.confirmOnUnsavedClose}
                onChange={(event) =>
                  setFilesDraft((current) => ({
                    ...current,
                    confirmOnUnsavedClose: event.target.checked,
                  }))
                }
              />
              Confirm before closing unsaved tabs
            </label>
            <SectionActions
              canSave={hasChanges(filesDraft, settings.files)}
              onSave={() => onSaveFiles(filesDraft)}
            />
          </SectionCard>
        );
      case "about":
        return (
          <SectionCard
            title="About"
            description="Current app details and the stack behind Markora."
          >
            <p className="text-sm text-app-text">Markora is a desktop-first markdown editor.</p>
            <p className="text-sm text-app-text/70">{`Version ${version}`}</p>
            <p className="text-sm text-app-text/70">
              Built with Tauri, Rust, React, TypeScript, and CodeMirror 6.
            </p>
          </SectionCard>
        );
      case "template":
        return (
          <SectionCard
            title="New Document Template"
            description="This content is used only for newly created documents."
          >
            <FieldLabel htmlFor="template-content">Template content</FieldLabel>
            <textarea
              id="template-content"
              className="min-h-64 w-full rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-4 py-3 font-mono text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)]"
              value={templateDraftValue}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setTemplateDraftValue(event.target.value)
              }
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)]"
                onClick={() => onSaveTemplate(templateDraftValue)}
              >
                Save template
              </button>
              <button
                type="button"
                className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] px-3 py-2 text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)]"
                onClick={onResetTemplate}
              >
                Reset template
              </button>
            </div>
          </SectionCard>
        );
      case "advanced":
        return (
          <SectionCard
            title="Advanced"
            description="Use reset carefully. This restores both app preferences and authoring defaults."
          >
            <button
              type="button"
              className="rounded-app-sm border border-red-300/70 bg-red-50/85 px-3 py-2 text-sm text-red-700 backdrop-blur-[var(--glass-blur-soft)]"
              onClick={() => {
                if (window.confirm("Reset all settings to their defaults?")) {
                  onResetAll();
                }
              }}
            >
              Reset all settings
            </button>
          </SectionCard>
        );
      default:
        return null;
    }
  };

  return (
    <section className="h-full min-h-0 p-4" aria-label="Settings">
      <div className="grid h-full min-h-0 grid-cols-[18rem_minmax(0,1fr)] gap-4">
        <aside className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-panel)] p-4 backdrop-blur-[var(--glass-blur-soft)] shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_14px_36px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-start">
            <button
              type="button"
              className="rounded-app-sm border border-[color:var(--glass-border)] bg-[color:var(--glass-elevated)] px-3 py-2 text-sm text-app-text backdrop-blur-[var(--glass-blur-soft)]"
              onClick={onClose}
            >
              Back to editor
            </button>
          </div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-app-text">Settings</h2>
            <p className="text-sm text-app-text/70">Tune Markora for your writing flow.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text/50">
                Application
              </h3>
              <SidebarButton
                label="Appearance"
                isActive={activeSection === "appearance"}
                onClick={() => setActiveSection("appearance")}
              />
              <SidebarButton
                label="Editor"
                isActive={activeSection === "editor"}
                onClick={() => setActiveSection("editor")}
              />
              <SidebarButton
                label="Preview"
                isActive={activeSection === "preview"}
                onClick={() => setActiveSection("preview")}
              />
              <SidebarButton
                label="Files"
                isActive={activeSection === "files"}
                onClick={() => setActiveSection("files")}
              />
              <SidebarButton
                label="About"
                isActive={activeSection === "about"}
                onClick={() => setActiveSection("about")}
              />
              <SidebarButton
                label="Advanced"
                isActive={activeSection === "advanced"}
                onClick={() => setActiveSection("advanced")}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-app-text/50">
                Authoring Defaults
              </h3>
              <SidebarButton
                label="New Document Template"
                isActive={activeSection === "template"}
                onClick={() => setActiveSection("template")}
              />
            </div>
          </div>
        </aside>

        <div className="min-h-0 overflow-auto">{renderContent()}</div>
      </div>
    </section>
  );
}
