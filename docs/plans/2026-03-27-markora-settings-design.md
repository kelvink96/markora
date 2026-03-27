# Markora Settings Page Design

## Overview

This document defines the first settings experience for Markora as a power-user markdown tool.

Markora already has the foundations of a desktop editor: native file dialogs, keyboard shortcuts, split editor and preview panes, and lightweight feature stores. What it does not yet have is a central place for users to tune the editing environment, persist those choices across launches, or manage authoring defaults intentionally.

The goal of this design is to introduce a dedicated settings experience that feels native to a serious desktop editor while staying consistent with the current architecture: document state in Zustand, file and native behavior in Tauri, and markdown rendering in Rust.

## Goal

Markora should offer a focused but extensible settings system that:

- persists user preferences across app restarts
- separates global app behavior from authoring defaults
- applies safe UI changes immediately
- supports a `system` appearance mode in addition to `light` and `dark`
- includes an explicit reset flow
- includes an `About` section for app information and future support links

## Chosen Direction

The selected direction is a **desktop-style settings view with sidebar navigation** and a **two-level information model**:

1. `Application`
2. `Authoring Defaults`

This is the right fit for Markora because it keeps app preferences such as appearance and autosave separate from document-template choices such as starter markdown content. Power users get a clean mental model, and the app gets room to grow without turning one screen into an undifferentiated wall of toggles.

## Information Architecture

### Application

This group contains preferences that affect how Markora behaves as an application.

Sections:

- `Appearance`
- `Editor`
- `Preview`
- `Files`
- `About`
- `Advanced`

### Authoring Defaults

This group contains defaults that apply to future documents rather than currently open ones.

Sections:

- `New Document Template`
- `Markdown Preferences`

The first implementation only needs `New Document Template`. `Markdown Preferences` can exist as a reserved category until the app gains more authoring-style options.

## Settings Scope

### Appearance

Initial controls:

- theme: `system`, `light`, `dark`
- editor font size
- preview font scale
- editor line height
- default split ratio
- show status bar

`system` becomes the default theme behavior for new users. The app should resolve system preference at runtime while preserving the explicit stored preference as `system`, not flattening it to `light` or `dark`.

### Editor

Initial controls:

- word wrap
- line numbers
- highlight active line
- tab size
- soft tabs

These settings should apply live to the CodeMirror editor.

### Preview

Initial controls:

- sync scroll
- open links externally
- preview content width
- code block theme mode placeholder for later

The MVP only needs the first three values to be modeled if the fourth would create implementation churn without visible value yet.

### Files

Initial controls:

- autosave
- restore previous session
- confirm before closing unsaved tabs
- default save extension

The first implementation may store `default save extension` even if the save flow still only exposes `.md`, as long as the control is not shown prematurely. Visible controls should only ship when behavior is wired end-to-end.

### New Document Template

Initial controls:

- editable starter markdown template
- reset template to default

This section is intentionally distinct from app appearance and editor preferences. The template should only affect documents created after the setting is saved.

### About

Initial contents:

- app name
- app version
- core technology summary
- placeholder affordance for future links such as release notes or licenses

The About section is informational, not a dumping ground for advanced settings.

### Advanced

Initial controls:

- reset all settings

Reset should require confirmation and restore both application settings and authoring defaults to the shipped defaults.

## Navigation and Interaction Model

The settings UI should not be a modal. It should be a dedicated view opened from the existing settings button in the top bar.

Expected structure:

- left sidebar with section navigation
- right detail panel with section content
- section title, short description, and grouped controls

Interaction rules:

- low-risk settings apply immediately
- text-heavy settings such as the new document template use explicit `Save` and `Reset`
- destructive actions require confirmation
- authoring defaults are clearly labeled as affecting future documents only

This keeps the experience desktop-like and scalable.

## Data Model and Ownership

The document store must remain focused on current document state.

### Keep Separate Stores

- `document` store: open tabs, active tab, content, dirty state
- new `settings` store: persistent app preferences and authoring defaults

This separation prevents settings changes from being coupled to tab lifecycle or current content mutations.

### Suggested Settings Shape

```ts
type ThemePreference = "system" | "light" | "dark";

interface AppearanceSettings {
  theme: ThemePreference;
  editorFontSize: number;
  previewFontScale: number;
  editorLineHeight: number;
  splitRatio: number;
  showStatusBar: boolean;
}

interface EditorSettings {
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  tabSize: number;
  softTabs: boolean;
}

interface PreviewSettings {
  syncScroll: boolean;
  openLinksExternally: boolean;
  contentWidth: "narrow" | "normal" | "wide";
}

interface FileSettings {
  autosave: boolean;
  restorePreviousSession: boolean;
  confirmOnUnsavedClose: boolean;
}

interface AuthoringDefaults {
  newDocumentTemplate: string;
}

interface MarkoraSettings {
  appearance: AppearanceSettings;
  editor: EditorSettings;
  preview: PreviewSettings;
  files: FileSettings;
  authoring: AuthoringDefaults;
}
```

The exact field names can shift during implementation, but the categories and boundaries should hold.

## Persistence Strategy

Settings should be persisted through Tauri rather than browser-only storage.

Reasons:

- Markora is a desktop app, so users expect native-feeling persistence
- settings should remain stable across frontend reloads
- future native behaviors such as session restore or OS-specific defaults fit naturally into app-managed configuration

Recommended direction:

- add a small Tauri settings command surface for reading, writing, and resetting settings
- store a serialized settings file in the app config directory
- load settings during app startup and hydrate the frontend settings store

The frontend should not access the filesystem directly.

## Theme Resolution

`system` support requires one extra layer beyond the current theme store.

Behavior:

- persisted preference stores `system`, `light`, or `dark`
- resolved runtime theme becomes either `light` or `dark`
- when preference is `system`, the app follows the OS color scheme
- if the OS scheme changes while the app is open, the shell should update reactively if practical in the current stack

This keeps the stored preference semantically correct while allowing the shell to continue consuming a concrete active theme.

## State Flow

Expected flow:

1. App starts
2. Frontend asks Tauri for persisted settings
3. Settings store hydrates with persisted values or defaults
4. App shell, editor, preview, and status bar subscribe to relevant settings
5. User changes a setting
6. Frontend updates the settings store immediately
7. Frontend persists the updated settings through Tauri

Template flow:

1. User edits the new document template in settings
2. User saves the template explicitly
3. Future `newDocument()` calls use the persisted template
4. Existing open documents remain unchanged

## Integration Surfaces

Likely frontend surfaces:

- `src/App.tsx`
- `src/app/app-shell/app-shell.tsx`
- `src/components/editor-page/top-bar/top-bar.tsx`
- editor-related components and CodeMirror wiring
- preview-related components
- new `src/features/settings/` area

Likely Rust surfaces:

- `src-tauri/src/lib.rs`
- new settings command module under `src-tauri/src/commands/`

## UX Expectations

After this change:

- users can configure Markora without losing preferences between launches
- the theme system feels complete because `system` is available
- advanced users can tune editor and preview behavior in one place
- the starter document becomes intentional instead of hardcoded app copy
- resetting configuration is discoverable and safe

## Testing Strategy

The implementation should verify:

- default settings are well-defined and type-safe
- persisted settings load correctly on startup
- resetting settings restores shipped defaults
- `system` theme resolves correctly
- editor settings update the active editor presentation
- preview settings update the preview presentation
- changing authoring defaults does not mutate existing open tabs
- new documents use the saved template
- About content renders app metadata reliably

Testing should include frontend store tests, component tests for key settings interactions, and Rust tests for settings read/write/reset behavior.

## What This Pass Does Not Include

This pass does not introduce:

- per-document settings overrides
- markdown parsing changes in Rust
- editor keymap modes such as Vim or Emacs
- cloud sync
- plugin or extension management

Those can be added later if the settings architecture stays clean.

## Follow-On Work

After this settings pass, likely next expansions are:

- markdown style preferences
- session recovery details for restored tabs
- additional preview typography controls
- keyboard shortcut customization
- export or import settings
