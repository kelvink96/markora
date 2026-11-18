use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

/// The most picked files remembered across restarts.
const MAX_REMEMBERED_PATHS: usize = 200;

/// One remembered file: its comparison key and the real path (for image folders).
struct Entry {
    key: PathBuf,
    path: PathBuf,
}

/// Files the user picked through a native dialog, this run or an earlier one.
///
/// `read_file` and `write_file` only touch paths in this list, so the webview can't
/// read or write arbitrary files even if something in it misbehaves (issue #21).
/// Picked paths are saved to a file in the app config folder, so "restore previous
/// session" can reopen them next launch. Only dialog picks ever get in.
/// `Mutex` lets several commands share the list safely across threads.
#[derive(Default)]
pub struct AllowedPaths {
    entries: Mutex<Vec<Entry>>,
    store: Option<PathBuf>,
}

impl AllowedPaths {
    /// Loads the remembered paths from `store` (a JSON list of strings) and saves
    /// future picks back to it. A missing or unreadable file just means an empty list.
    pub fn persistent(store: PathBuf) -> Self {
        let remembered: Vec<String> = fs::read_to_string(&store)
            .ok()
            .and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or_default();

        // Paths whose folder has since disappeared can't be normalized; drop them.
        let entries = remembered
            .into_iter()
            .map(PathBuf::from)
            .filter_map(|path| normalize(&path).ok().map(|key| Entry { key, path }))
            .collect();

        Self { entries: Mutex::new(entries), store: Some(store) }
    }

    /// The real paths currently remembered.
    pub fn paths(&self) -> Vec<PathBuf> {
        match self.entries.lock() {
            Ok(entries) => entries.iter().map(|entry| entry.path.clone()).collect(),
            Err(_) => Vec::new(),
        }
    }

    pub fn allow(&self, path: &Path) -> Result<(), String> {
        let key = normalize(path)?;
        let mut entries = self.entries.lock().map_err(|e| e.to_string())?;

        // Picking a file again moves it to the end, so the oldest picks fall off first.
        entries.retain(|entry| entry.key != key);
        entries.push(Entry { key, path: path.to_path_buf() });
        if entries.len() > MAX_REMEMBERED_PATHS {
            let overflow = entries.len() - MAX_REMEMBERED_PATHS;
            entries.drain(..overflow);
        }

        self.save(&entries);
        Ok(())
    }

    pub fn ensure_allowed(&self, path: &Path) -> Result<(), String> {
        let key = normalize(path)?;
        let entries = self.entries.lock().map_err(|e| e.to_string())?;
        if entries.iter().any(|entry| entry.key == key) {
            Ok(())
        } else {
            Err(format!("Access denied: {} was not opened through a file dialog", path.display()))
        }
    }

    // Best effort: a failed save must not stop the user from opening the file they picked.
    fn save(&self, entries: &[Entry]) {
        let Some(store) = &self.store else { return };
        let paths: Vec<String> = entries.iter().map(|e| e.path.to_string_lossy().into_owned()).collect();

        let result = (|| -> Result<(), String> {
            if let Some(folder) = store.parent() {
                fs::create_dir_all(folder).map_err(|e| e.to_string())?;
            }
            let json = serde_json::to_string_pretty(&paths).map_err(|e| e.to_string())?;
            fs::write(store, json).map_err(|e| e.to_string())
        })();

        if let Err(error) = result {
            eprintln!("could not save remembered paths to {}: {error}", store.display());
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
pub fn allow_images_near(app: &AppHandle, path: &Path) {
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

    // A fresh folder per test, so parallel tests never share a store file.
    fn unique_dir(label: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = env::temp_dir().join(format!("markora-{label}-{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_remembered_paths_survive_a_restart() {
        let dir = unique_dir("restart");
        let store = dir.join("allowed.json");
        let file = dir.join("notes.md");

        AllowedPaths::persistent(store.clone()).allow(&file).unwrap();
        let after_restart = AllowedPaths::persistent(store);

        assert!(after_restart.ensure_allowed(&file).is_ok());
        assert!(after_restart.ensure_allowed(&dir.join("other.md")).is_err());
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_picking_a_file_twice_remembers_it_once() {
        let dir = unique_dir("twice");
        let allowed = AllowedPaths::persistent(dir.join("allowed.json"));
        let file = dir.join("notes.md");

        allowed.allow(&file).unwrap();
        allowed.allow(&file).unwrap();

        assert_eq!(allowed.paths().len(), 1);
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_remembered_paths_in_deleted_folders_are_dropped_on_load() {
        let dir = unique_dir("deleted");
        let store = dir.join("allowed.json");
        let kept = dir.join("kept.md");
        let gone = dir.join("deleted-folder").join("gone.md");
        let json = serde_json::to_string(&[kept.to_str().unwrap(), gone.to_str().unwrap()]).unwrap();
        fs::write(&store, json).unwrap();

        let allowed = AllowedPaths::persistent(store);

        assert_eq!(allowed.paths(), vec![kept]);
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_a_corrupt_store_means_nothing_is_remembered() {
        let dir = unique_dir("corrupt");
        let store = dir.join("allowed.json");
        fs::write(&store, "{ not json").unwrap();

        let allowed = AllowedPaths::persistent(store);

        assert!(allowed.paths().is_empty());
        assert!(allowed.ensure_allowed(&dir.join("notes.md")).is_err());
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_the_store_folder_is_created_when_missing() {
        let dir = unique_dir("nested");
        let store = dir.join("config").join("app").join("allowed.json");

        AllowedPaths::persistent(store.clone()).allow(&dir.join("a.md")).unwrap();

        assert!(store.exists());
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_only_the_most_recent_picks_are_kept() {
        let dir = unique_dir("cap");
        let allowed = AllowedPaths::persistent(dir.join("allowed.json"));

        for index in 0..(MAX_REMEMBERED_PATHS + 5) {
            allowed.allow(&dir.join(format!("note-{index}.md"))).unwrap();
        }

        assert_eq!(allowed.paths().len(), MAX_REMEMBERED_PATHS);
        assert!(allowed.ensure_allowed(&dir.join("note-0.md")).is_err());
        assert!(allowed
            .ensure_allowed(&dir.join(format!("note-{}.md", MAX_REMEMBERED_PATHS + 4)))
            .is_ok());
        fs::remove_dir_all(dir).ok();
    }
}
