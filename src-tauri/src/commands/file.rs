use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

/// Paths the user picked through a native dialog during this session.
///
/// `read_file` and `write_file` only touch paths in this set, so the webview can't
/// read or write arbitrary files even if something in it misbehaves (issue #21).
/// `Mutex` lets several commands share the set safely across threads.
#[derive(Default)]
pub struct AllowedPaths(Mutex<HashSet<PathBuf>>);

impl AllowedPaths {
    pub fn allow(&self, path: &Path) -> Result<(), String> {
        let key = normalize(path)?;
        self.0.lock().map_err(|e| e.to_string())?.insert(key);
        Ok(())
    }

    pub fn ensure_allowed(&self, path: &Path) -> Result<(), String> {
        let key = normalize(path)?;
        let allowed = self.0.lock().map_err(|e| e.to_string())?;
        if allowed.contains(&key) {
            Ok(())
        } else {
            Err(format!("Access denied: {} was not opened through a file dialog", path.display()))
        }
    }
}

/// Builds a stable comparison key for a path: absolute, with `..`/symlinks resolved
/// through the parent folder (the file itself may not exist yet when saving).
fn normalize(path: &Path) -> Result<PathBuf, String> {
    if !path.is_absolute() {
        return Err(format!("Expected an absolute path, got {}", path.display()));
    }
    let parent = path.parent().ok_or("Path has no parent folder")?;
    let file_name = path.file_name().ok_or("Path has no file name")?;
    let parent = fs::canonicalize(parent).map_err(|e| e.to_string())?;
    let full = parent.join(file_name);

    // Windows paths are case-insensitive, so compare them in lowercase.
    if cfg!(windows) {
        Ok(PathBuf::from(full.to_string_lossy().to_lowercase()))
    } else {
        Ok(full)
    }
}

/// Lets the preview load images that sit next to (or below) the picked document.
fn allow_images_near(app: &AppHandle, path: &Path) {
    if let Some(folder) = path.parent() {
        if let Err(error) = app.asset_protocol_scope().allow_directory(folder, true) {
            eprintln!("could not allow image folder {}: {error}", folder.display());
        }
    }
}

// Shows the native open dialog and remembers the chosen file so it can be read.
// `async` keeps the blocking dialog off the main thread, which would otherwise freeze.
#[tauri::command]
pub async fn pick_open_path(
    app: AppHandle,
    allowed: State<'_, AllowedPaths>,
) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_file();

    remember(&app, &allowed, picked)
}

// Shows the native save dialog and remembers the chosen file so it can be written.
#[tauri::command]
pub async fn pick_save_path(
    app: AppHandle,
    allowed: State<'_, AllowedPaths>,
    default_path: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file().add_filter("Markdown", &["md"]);
    if let Some(name) = default_path {
        dialog = dialog.set_file_name(name);
    }

    remember(&app, &allowed, dialog.blocking_save_file())
}

fn remember(
    app: &AppHandle,
    allowed: &AllowedPaths,
    picked: Option<tauri_plugin_dialog::FilePath>,
) -> Result<Option<String>, String> {
    // `None` means the user cancelled the dialog.
    let Some(picked) = picked else { return Ok(None) };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    allowed.allow(&path)?;
    allow_images_near(app, &path);
    Ok(Some(path.to_string_lossy().into_owned()))
}

// Reads UTF-8 text from a file the user picked this session.
#[tauri::command]
pub fn read_file(allowed: State<'_, AllowedPaths>, path: String) -> Result<String, String> {
    read_allowed(&allowed, &path)
}

// Writes UTF-8 text to a file the user picked this session, creating or overwriting it.
#[tauri::command]
pub fn write_file(
    allowed: State<'_, AllowedPaths>,
    path: String,
    content: String,
) -> Result<(), String> {
    write_allowed(&allowed, &path, &content)
}

// The command bodies live in plain functions so tests can call them without a running app.
fn read_allowed(allowed: &AllowedPaths, path: &str) -> Result<String, String> {
    allowed.ensure_allowed(Path::new(path))?;
    // Convert Rust's io::Error into a plain String so it crosses the Tauri boundary cleanly.
    fs::read_to_string(path).map_err(|error| error.to_string())
}

fn write_allowed(allowed: &AllowedPaths, path: &str, content: &str) -> Result<(), String> {
    allowed.ensure_allowed(Path::new(path))?;
    // Result<(), String> means "either success with no payload, or an error message".
    fs::write(path, content).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn tmp(name: &str) -> String {
        env::temp_dir()
            .join(name)
            .to_str()
            .unwrap()
            .to_string()
    }

    fn allowing(path: &str) -> AllowedPaths {
        let allowed = AllowedPaths::default();
        allowed.allow(Path::new(path)).unwrap();
        allowed
    }

    #[test]
    fn test_read_file() {
        let path = tmp("markora_read_test.md");
        fs::write(&path, "# Test Content").unwrap();
        let result = read_allowed(&allowing(&path), &path);
        assert_eq!(result.unwrap(), "# Test Content");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_write_file() {
        let path = tmp("markora_write_test.md");
        let result = write_allowed(&allowing(&path), &path, "# Written");
        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&path).unwrap(), "# Written");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_read_missing_file_returns_err() {
        let path = tmp("markora_missing_test.md");
        let result = read_allowed(&allowing(&path), &path);
        assert!(result.is_err());
    }

    #[test]
    fn test_read_rejects_unpicked_path() {
        let path = tmp("markora_unpicked_read.md");
        fs::write(&path, "secret").unwrap();
        let result = read_allowed(&AllowedPaths::default(), &path);
        assert!(result.unwrap_err().contains("Access denied"));
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_write_rejects_unpicked_path() {
        let picked = tmp("markora_picked.md");
        let other = tmp("markora_not_picked.md");
        let result = write_allowed(&allowing(&picked), &other, "x");
        assert!(result.is_err());
        assert!(!Path::new(&other).exists());
    }

    #[test]
    fn test_rejects_relative_paths() {
        let result = write_allowed(&AllowedPaths::default(), "notes.md", "x");
        assert!(result.is_err());
    }

    #[test]
    fn test_parent_traversal_resolves_to_the_same_file() {
        let picked = tmp("markora_traversal.md");
        let dir = env::temp_dir();
        let folder = dir.file_name().unwrap().to_str().unwrap();
        // e.g. C:\...\Temp\..\Temp\markora_traversal.md points at the picked file.
        let roundabout = dir.join("..").join(folder).join("markora_traversal.md");
        let result = write_allowed(&allowing(&picked), roundabout.to_str().unwrap(), "ok");
        assert!(result.is_ok());
        fs::remove_file(&picked).ok();
    }

    #[cfg(windows)]
    #[test]
    fn test_windows_paths_compare_case_insensitively() {
        let picked = tmp("markora_case.md");
        let upper = picked.to_uppercase();
        let result = write_allowed(&allowing(&picked), &upper, "ok");
        assert!(result.is_ok());
        fs::remove_file(&picked).ok();
    }
}
