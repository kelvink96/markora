use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ThemePreference {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ColorScheme {
    Standard,
    Sepia,
    HighContrast,
    Moss,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: ThemePreference,
    #[serde(default = "default_color_scheme")]
    pub color_scheme: ColorScheme,
    pub editor_font_size: u16,
    // 1.0 means 100%. Earlier versions stored fixed-point integers (100, 160); the
    // frontend converts those on load, so floats here accept both.
    pub preview_font_scale: f32,
    // Unitless multiplier, e.g. 1.6.
    pub editor_line_height: f32,
    pub show_status_bar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EditorSettings {
    pub word_wrap: bool,
    pub line_numbers: bool,
    pub highlight_active_line: bool,
    // Fade every paragraph but the current one in Focus. Files from before Focus lack it: on.
    #[serde(default = "default_focus_dimming")]
    pub focus_dimming: bool,
}

fn default_focus_dimming() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PreviewSettings {
    pub sync_scroll: bool,
    pub open_links_externally: bool,
    pub content_width: PreviewContentWidth,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PreviewContentWidth {
    Narrow,
    Normal,
    Wide,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FileSettings {
    pub autosave: bool,
    pub restore_previous_session: bool,
    pub confirm_on_unsaved_close: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthoringDefaults {
    pub new_document_template: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingSettings {
    // The Tour version the user last finished or skipped; 0 means unseen.
    #[serde(default)]
    pub tour_version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettings {
    // Check for a new version once at launch.
    #[serde(default = "default_check_automatically")]
    pub check_automatically: bool,
}

impl Default for UpdateSettings {
    fn default() -> Self {
        Self {
            check_automatically: default_check_automatically(),
        }
    }
}

fn default_check_automatically() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarkoraSettings {
    pub appearance: AppearanceSettings,
    pub editor: EditorSettings,
    pub preview: PreviewSettings,
    pub files: FileSettings,
    pub authoring: AuthoringDefaults,
    // Absent in files saved before the Tour existed.
    #[serde(default)]
    pub onboarding: OnboardingSettings,
    // Absent in files saved before in-app updates existed.
    #[serde(default)]
    pub updates: UpdateSettings,
}

fn default_color_scheme() -> ColorScheme {
    ColorScheme::Standard
}

pub fn default_settings() -> MarkoraSettings {
    MarkoraSettings {
        appearance: AppearanceSettings {
            theme: ThemePreference::System,
            color_scheme: default_color_scheme(),
            editor_font_size: 16,
            preview_font_scale: 1.0,
            editor_line_height: 1.7,
            show_status_bar: true,
        },
        editor: EditorSettings {
            word_wrap: true,
            line_numbers: false,
            highlight_active_line: true,
            focus_dimming: default_focus_dimming(),
        },
        preview: PreviewSettings {
            sync_scroll: true,
            open_links_externally: true,
            content_width: PreviewContentWidth::Normal,
        },
        files: FileSettings {
            autosave: false,
            restore_previous_session: false,
            confirm_on_unsaved_close: true,
        },
        authoring: AuthoringDefaults {
            new_document_template: "# Welcome to Markora\n\nStart writing your markdown here...\n"
                .into(),
        },
        onboarding: OnboardingSettings::default(),
        updates: UpdateSettings::default(),
    }
}

fn settings_file_path(config_dir: &Path) -> PathBuf {
    config_dir.join(SETTINGS_FILE_NAME)
}

pub fn load_settings_from_dir(config_dir: &Path) -> Result<MarkoraSettings, String> {
    let path = settings_file_path(config_dir);
    if !path.exists() {
        return Ok(default_settings());
    }

    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub fn save_settings_to_dir(
    config_dir: &Path,
    settings: &MarkoraSettings,
) -> Result<MarkoraSettings, String> {
    fs::create_dir_all(config_dir).map_err(|error| error.to_string())?;
    let path = settings_file_path(config_dir);
    let content = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())?;
    Ok(settings.clone())
}

pub fn reset_settings_in_dir(config_dir: &Path) -> Result<MarkoraSettings, String> {
    // Reset restores preferences, not history: the recorded tour version stays.
    let onboarding = load_settings_from_dir(config_dir)
        .map(|settings| settings.onboarding)
        .unwrap_or_default();

    let mut defaults = default_settings();
    defaults.onboarding = onboarding;
    if defaults.onboarding != OnboardingSettings::default() {
        // Overwrite in one write so a failure cannot lose the tour version.
        return save_settings_to_dir(config_dir, &defaults);
    }

    let path = settings_file_path(config_dir);
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(defaults)
}

fn resolve_config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<MarkoraSettings, String> {
    let config_dir = resolve_config_dir(&app)?;
    load_settings_from_dir(&config_dir)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: MarkoraSettings) -> Result<MarkoraSettings, String> {
    let config_dir = resolve_config_dir(&app)?;
    save_settings_to_dir(&config_dir, &settings)
}

#[tauri::command]
pub fn reset_settings(app: AppHandle) -> Result<MarkoraSettings, String> {
    let config_dir = resolve_config_dir(&app)?;
    reset_settings_in_dir(&config_dir)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        env, fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    fn temp_settings_dir() -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = env::temp_dir().join(format!("markora-settings-{unique}"));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn load_settings_returns_defaults_when_file_is_missing() {
        let temp_dir = temp_settings_dir();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        assert_eq!(settings, default_settings());

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn save_then_load_round_trips_settings() {
        let temp_dir = temp_settings_dir();
        let mut settings = default_settings();
        settings.appearance.theme = ThemePreference::Dark;
        settings.authoring.new_document_template = "# Saved".into();

        save_settings_to_dir(&temp_dir, &settings).unwrap();
        let reloaded = load_settings_from_dir(&temp_dir).unwrap();

        assert_eq!(reloaded, settings);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn reset_settings_restores_defaults() {
        let temp_dir = temp_settings_dir();
        let mut settings = default_settings();
        settings.authoring.new_document_template = "# Custom".into();

        save_settings_to_dir(&temp_dir, &settings).unwrap();
        let reset = reset_settings_in_dir(&temp_dir).unwrap();

        assert_eq!(reset, default_settings());
        assert_eq!(load_settings_from_dir(&temp_dir).unwrap(), default_settings());

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn load_settings_accepts_files_saved_by_earlier_versions() {
        let temp_dir = temp_settings_dir();
        let path = settings_file_path(&temp_dir);
        let legacy_settings = r##"{
  "appearance": {
    "theme": "system",
    "editorFontSize": 15,
    "previewFontScale": 100,
    "editorLineHeight": 160,
    "splitRatio": 50,
    "showStatusBar": true
  },
  "editor": {
    "wordWrap": true,
    "lineNumbers": false,
    "highlightActiveLine": true,
    "tabSize": 2,
    "softTabs": true
  },
  "preview": {
    "syncScroll": true,
    "openLinksExternally": true,
    "contentWidth": "normal"
  },
  "files": {
    "autosave": false,
    "restorePreviousSession": false,
    "confirmOnUnsavedClose": true
  },
  "authoring": {
    "newDocumentTemplate": "# Legacy"
  }
}"##;

        fs::write(&path, legacy_settings).unwrap();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        // Removed keys (splitRatio, tabSize, softTabs) are ignored, and the old
        // fixed-point numbers load as-is for the frontend to convert.
        assert_eq!(settings.appearance.editor_line_height, 160.0);
        assert_eq!(settings.appearance.preview_font_scale, 100.0);
        assert_eq!(settings.authoring.new_document_template, "# Legacy");

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn accepts_the_decimal_values_the_frontend_sends() {
        // The frontend's defaults use 1.6 and 1 (not 160 and 100); u16 fields rejected these.
        let payload = r##"{
  "appearance": {
    "theme": "dark", "colorScheme": "sepia", "editorFontSize": 18,
    "previewFontScale": 1.25, "editorLineHeight": 1.6, "showStatusBar": true
  },
  "editor": { "wordWrap": false, "lineNumbers": true, "highlightActiveLine": false },
  "preview": { "syncScroll": true, "openLinksExternally": true, "contentWidth": "wide" },
  "files": { "autosave": false, "restorePreviousSession": false, "confirmOnUnsavedClose": true },
  "authoring": { "newDocumentTemplate": "# Hi" }
}"##;

        let settings: MarkoraSettings = serde_json::from_str(payload).unwrap();

        assert_eq!(settings.appearance.editor_line_height, 1.6);
        assert_eq!(settings.appearance.preview_font_scale, 1.25);
        assert!(!settings.editor.word_wrap);
    }

    #[test]
    fn legacy_settings_file_without_onboarding_counts_as_unseen() {
        let temp_dir = temp_settings_dir();
        let legacy = r##"{
  "appearance": { "theme": "system", "editorFontSize": 16, "previewFontScale": 1.0,
                  "editorLineHeight": 1.7, "showStatusBar": true },
  "editor": { "wordWrap": true, "lineNumbers": false, "highlightActiveLine": true },
  "preview": { "syncScroll": true, "openLinksExternally": true, "contentWidth": "normal" },
  "files": { "autosave": false, "restorePreviousSession": false, "confirmOnUnsavedClose": true },
  "authoring": { "newDocumentTemplate": "# Legacy" }
}"##;
        fs::write(settings_file_path(&temp_dir), legacy).unwrap();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        assert_eq!(settings.onboarding.tour_version, 0);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn legacy_settings_file_without_updates_checks_automatically() {
        let temp_dir = temp_settings_dir();
        let legacy = r##"{
  "appearance": { "theme": "system", "editorFontSize": 16, "previewFontScale": 1.0,
                  "editorLineHeight": 1.7, "showStatusBar": true },
  "editor": { "wordWrap": true, "lineNumbers": false, "highlightActiveLine": true },
  "preview": { "syncScroll": true, "openLinksExternally": true, "contentWidth": "normal" },
  "files": { "autosave": false, "restorePreviousSession": false, "confirmOnUnsavedClose": true },
  "authoring": { "newDocumentTemplate": "# Legacy" }
}"##;
        fs::write(settings_file_path(&temp_dir), legacy).unwrap();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        assert!(settings.updates.check_automatically);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn legacy_settings_file_without_focus_dimming_dims_by_default() {
        let temp_dir = temp_settings_dir();
        let legacy = r##"{
  "appearance": { "theme": "system", "editorFontSize": 16, "previewFontScale": 1.0,
                  "editorLineHeight": 1.7, "showStatusBar": true },
  "editor": { "wordWrap": true, "lineNumbers": false, "highlightActiveLine": true },
  "preview": { "syncScroll": true, "openLinksExternally": true, "contentWidth": "normal" },
  "files": { "autosave": false, "restorePreviousSession": false, "confirmOnUnsavedClose": true },
  "authoring": { "newDocumentTemplate": "# Legacy" }
}"##;
        fs::write(settings_file_path(&temp_dir), legacy).unwrap();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        assert!(settings.editor.focus_dimming);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn focus_dimming_opt_out_round_trips_and_reset_restores_it() {
        let temp_dir = temp_settings_dir();
        let mut settings = default_settings();
        settings.editor.focus_dimming = false;
        save_settings_to_dir(&temp_dir, &settings).unwrap();

        let reloaded = load_settings_from_dir(&temp_dir).unwrap();
        assert!(!reloaded.editor.focus_dimming);

        let reset = reset_settings_in_dir(&temp_dir).unwrap();
        assert!(reset.editor.focus_dimming);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn update_check_opt_out_round_trips_and_reset_restores_it() {
        let temp_dir = temp_settings_dir();
        let mut settings = default_settings();
        settings.updates.check_automatically = false;
        save_settings_to_dir(&temp_dir, &settings).unwrap();

        let reloaded = load_settings_from_dir(&temp_dir).unwrap();
        assert!(!reloaded.updates.check_automatically);

        let reset = reset_settings_in_dir(&temp_dir).unwrap();
        assert!(reset.updates.check_automatically);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn tour_version_defaults_to_unseen_and_round_trips() {
        let temp_dir = temp_settings_dir();
        assert_eq!(default_settings().onboarding.tour_version, 0);

        let mut settings = default_settings();
        settings.onboarding.tour_version = 1;
        save_settings_to_dir(&temp_dir, &settings).unwrap();

        let reloaded = load_settings_from_dir(&temp_dir).unwrap();
        assert_eq!(reloaded.onboarding.tour_version, 1);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn reset_settings_keeps_the_recorded_tour_version() {
        let temp_dir = temp_settings_dir();
        let mut settings = default_settings();
        settings.authoring.new_document_template = "# Custom".into();
        settings.onboarding.tour_version = 1;
        save_settings_to_dir(&temp_dir, &settings).unwrap();

        let reset = reset_settings_in_dir(&temp_dir).unwrap();

        assert_eq!(reset.authoring, default_settings().authoring);
        assert_eq!(reset.onboarding.tour_version, 1);
        assert_eq!(load_settings_from_dir(&temp_dir).unwrap(), reset);

        fs::remove_dir_all(temp_dir).ok();
    }

    #[test]
    fn load_settings_defaults_missing_color_scheme_for_existing_files() {
        let temp_dir = temp_settings_dir();
        let path = settings_file_path(&temp_dir);
        let legacy_settings = r##"{
  "appearance": {
    "theme": "system",
    "editorFontSize": 15,
    "previewFontScale": 100,
    "editorLineHeight": 160,
    "splitRatio": 50,
    "showStatusBar": true
  },
  "editor": {
    "wordWrap": true,
    "lineNumbers": false,
    "highlightActiveLine": true,
    "tabSize": 2,
    "softTabs": true
  },
  "preview": {
    "syncScroll": true,
    "openLinksExternally": true,
    "contentWidth": "normal",
    "readerTheme": "paper"
  },
  "files": {
    "autosave": false,
    "restorePreviousSession": false,
    "confirmOnUnsavedClose": true
  },
  "authoring": {
    "newDocumentTemplate": "# Legacy"
  }
}"##;

        fs::write(&path, legacy_settings).unwrap();

        let settings = load_settings_from_dir(&temp_dir).unwrap();

        assert_eq!(settings.appearance.color_scheme, ColorScheme::Standard);

        fs::remove_dir_all(temp_dir).ok();
    }
}
