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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: ThemePreference,
    pub editor_font_size: u16,
    pub preview_font_scale: u16,
    pub editor_line_height: u16,
    pub split_ratio: u16,
    pub show_status_bar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EditorSettings {
    pub word_wrap: bool,
    pub line_numbers: bool,
    pub highlight_active_line: bool,
    pub tab_size: u8,
    pub soft_tabs: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PreviewSettings {
    pub sync_scroll: bool,
    pub open_links_externally: bool,
    pub content_width: PreviewContentWidth,
    #[serde(default = "default_reader_theme")]
    pub reader_theme: PreviewReaderTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PreviewContentWidth {
    Narrow,
    Normal,
    Wide,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PreviewReaderTheme {
    Paper,
    Dark,
    Sepia,
    HighContrast,
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarkoraSettings {
    pub appearance: AppearanceSettings,
    pub editor: EditorSettings,
    pub preview: PreviewSettings,
    pub files: FileSettings,
    pub authoring: AuthoringDefaults,
}

fn default_reader_theme() -> PreviewReaderTheme {
    PreviewReaderTheme::Paper
}

pub fn default_settings() -> MarkoraSettings {
    MarkoraSettings {
        appearance: AppearanceSettings {
            theme: ThemePreference::System,
            editor_font_size: 15,
            preview_font_scale: 100,
            editor_line_height: 160,
            split_ratio: 50,
            show_status_bar: true,
        },
        editor: EditorSettings {
            word_wrap: true,
            line_numbers: false,
            highlight_active_line: true,
            tab_size: 2,
            soft_tabs: true,
        },
        preview: PreviewSettings {
            sync_scroll: true,
            open_links_externally: true,
            content_width: PreviewContentWidth::Normal,
            reader_theme: default_reader_theme(),
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
    let path = settings_file_path(config_dir);
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }

    Ok(default_settings())
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
    fn load_settings_defaults_missing_reader_theme_for_existing_files() {
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

        assert_eq!(settings.preview.reader_theme, PreviewReaderTheme::Paper);

        fs::remove_dir_all(temp_dir).ok();
    }
}
