import type {
  AppearanceSettings,
  FileSettings,
  MarkoraSettings,
  PreviewSettings,
  ThemePreference,
} from "../../features/settings/settings-schema";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";

type SettingsSection = "appearance" | "preview" | "files" | "about" | "template" | "advanced";

interface SettingsPageProps {
  settings: MarkoraSettings;
  templateDraft: string;
  version: string;
  onClose: () => void;
  onUpdateAppearance: (appearance: Partial<AppearanceSettings>) => void;
  onUpdatePreview: (preview: Partial<PreviewSettings>) => void;
  onUpdateFiles: (files: Partial<FileSettings>) => void;
  onTemplateDraftChange: (value: string) => void;
  onSaveTemplate: () => void;
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
      className={`w-full rounded-app-md px-3 py-2 text-left text-sm transition ${
        isActive ? "bg-app-panel-strong text-app-text" : "text-app-text/70 hover:bg-app-panel/70"
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
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--ghost-border)] bg-app-panel p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
      <header className="mb-4 space-y-1">
        <h3 className="text-base font-semibold text-app-text">{title}</h3>
        <p className="text-sm text-app-text/70">{description}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
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

export function SettingsPage({
  settings,
  templateDraft,
  version,
  onClose,
  onUpdateAppearance,
  onUpdatePreview,
  onUpdateFiles,
  onTemplateDraftChange,
  onSaveTemplate,
  onResetTemplate,
  onResetAll,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const renderContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <SectionCard
            title="Appearance"
            description="Control the way Markora looks and how much interface chrome stays visible."
          >
            <FieldLabel htmlFor="theme-preference" helper="System follows your OS color scheme.">
              Theme
            </FieldLabel>
            <select
              id="theme-preference"
              className="rounded-app-md border border-[color:var(--ghost-border)] bg-app-panel-strong px-3 py-2"
              value={settings.appearance.theme}
              onChange={(event) =>
                onUpdateAppearance({ theme: event.target.value as ThemePreference })
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
                checked={settings.appearance.showStatusBar}
                onChange={(event) =>
                  onUpdateAppearance({ showStatusBar: event.target.checked })
                }
              />
              Keep the footer metrics visible while writing
            </label>
          </SectionCard>
        );
      case "preview":
        return (
          <SectionCard
            title="Preview"
            description="Tune the reading surface without changing the markdown source."
          >
            <FieldLabel htmlFor="preview-width">Preview width</FieldLabel>
            <select
              id="preview-width"
              className="rounded-app-md border border-[color:var(--ghost-border)] bg-app-panel-strong px-3 py-2"
              value={settings.preview.contentWidth}
              onChange={(event) =>
                onUpdatePreview({
                  contentWidth: event.target.value as PreviewSettings["contentWidth"],
                })
              }
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
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
                checked={settings.files.confirmOnUnsavedClose}
                onChange={(event) =>
                  onUpdateFiles({ confirmOnUnsavedClose: event.target.checked })
                }
              />
              Confirm before closing unsaved tabs
            </label>
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
              className="min-h-64 w-full rounded-[var(--radius-lg)] border border-[color:var(--ghost-border)] bg-app-editor px-4 py-3 font-mono text-sm text-app-text"
              value={templateDraft}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                onTemplateDraftChange(event.target.value)
              }
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-app-md bg-app-text px-3 py-2 text-sm text-app-bg"
                onClick={onSaveTemplate}
              >
                Save template
              </button>
              <button
                type="button"
                className="rounded-app-md border border-[color:var(--ghost-border)] px-3 py-2 text-sm text-app-text"
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
              className="rounded-app-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
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
        <aside className="rounded-[var(--radius-lg)] border border-[color:var(--ghost-border)] bg-app-panel p-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-app-text">Settings</h2>
              <p className="text-sm text-app-text/70">Tune Markora for your writing flow.</p>
            </div>
            <button
              type="button"
              className="rounded-app-md border border-[color:var(--ghost-border)] px-3 py-2 text-sm text-app-text"
              onClick={onClose}
            >
              Done
            </button>
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
