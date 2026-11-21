use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

const FILE_NAME: &str = "pending-whats-new.json";
const TEMP_FILE_NAME: &str = "pending-whats-new.json.tmp";

/// What an in-app update remembers just before it installs, so the next launch can say what
/// changed. It lives in a file, not webview storage: on Windows the installer ends the app
/// right after `install()`, before the webview has flushed anything to disk.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PendingWhatsNew {
    pub version: String,
    pub notes: String,
    pub published_at: Option<String>,
}

fn record_path(dir: &Path) -> PathBuf {
    dir.join(FILE_NAME)
}

/// Writes the record and syncs it to disk before returning. It goes through a temp file and a
/// rename so being killed mid-write never leaves a torn record behind.
pub fn save_pending_in_dir(dir: &Path, record: &PendingWhatsNew) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|error| error.to_string())?;
    let content = serde_json::to_string(record).map_err(|error| error.to_string())?;

    let temp_path = dir.join(TEMP_FILE_NAME);
    let mut file = File::create(&temp_path).map_err(|error| error.to_string())?;
    file.write_all(content.as_bytes()).map_err(|error| error.to_string())?;
    file.sync_all().map_err(|error| error.to_string())?;
    drop(file);

    fs::rename(&temp_path, record_path(dir)).map_err(|error| error.to_string())
}

/// A missing, corrupt or version-less file means there is nothing to announce, not an error:
/// a bad record must never get in the way of launching.
pub fn load_pending_from_dir(dir: &Path) -> Result<Option<PendingWhatsNew>, String> {
    let path = record_path(dir);
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let record = serde_json::from_str::<PendingWhatsNew>(&content)
        .ok()
        .filter(|record| !record.version.is_empty());
    Ok(record)
}

pub fn clear_pending_in_dir(dir: &Path) -> Result<(), String> {
    let path = record_path(dir);
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

// Beside settings.json, so the one folder holds everything Markora persists.
fn resolve_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_pending_whats_new(app: AppHandle, record: PendingWhatsNew) -> Result<(), String> {
    save_pending_in_dir(&resolve_dir(&app)?, &record)
}

#[tauri::command]
pub fn load_pending_whats_new(app: AppHandle) -> Result<Option<PendingWhatsNew>, String> {
    load_pending_from_dir(&resolve_dir(&app)?)
}

#[tauri::command]
pub fn clear_pending_whats_new(app: AppHandle) -> Result<(), String> {
    clear_pending_in_dir(&resolve_dir(&app)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        env, fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    fn temp_dir() -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = env::temp_dir().join(format!("markora-whats-new-{unique}"));
        fs::create_dir_all(&path).unwrap();
        path
    }

    fn record() -> PendingWhatsNew {
        PendingWhatsNew {
            version: "1.6.0".into(),
            notes: "## What's Changed".into(),
            published_at: Some("2026-11-20T10:00:00Z".into()),
        }
    }

    #[test]
    fn load_returns_none_when_nothing_is_saved() {
        let dir = temp_dir();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), None);

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn save_then_load_round_trips_the_record() {
        let dir = temp_dir();

        save_pending_in_dir(&dir, &record()).unwrap();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), Some(record()));

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn save_creates_a_missing_directory_and_leaves_no_temp_file() {
        let dir = temp_dir().join("nested");

        save_pending_in_dir(&dir, &record()).unwrap();

        let names: Vec<String> = fs::read_dir(&dir)
            .unwrap()
            .map(|entry| entry.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        assert_eq!(names, vec!["pending-whats-new.json".to_string()]);

        fs::remove_dir_all(dir.parent().unwrap()).ok();
    }

    #[test]
    fn save_replaces_an_earlier_record() {
        let dir = temp_dir();
        save_pending_in_dir(&dir, &record()).unwrap();
        let newer = PendingWhatsNew {
            version: "1.7.0".into(),
            notes: String::new(),
            published_at: None,
        };

        save_pending_in_dir(&dir, &newer).unwrap();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), Some(newer));

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn load_treats_a_corrupt_file_as_none() {
        let dir = temp_dir();
        fs::write(dir.join("pending-whats-new.json"), "{nope").unwrap();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), None);

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn load_treats_an_empty_version_as_none() {
        let dir = temp_dir();
        fs::write(
            dir.join("pending-whats-new.json"),
            r#"{"version":"","notes":"x","publishedAt":null}"#,
        )
        .unwrap();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), None);

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn clear_removes_the_record_and_is_fine_when_there_is_none() {
        let dir = temp_dir();
        save_pending_in_dir(&dir, &record()).unwrap();

        clear_pending_in_dir(&dir).unwrap();
        clear_pending_in_dir(&dir).unwrap();

        assert_eq!(load_pending_from_dir(&dir).unwrap(), None);

        fs::remove_dir_all(dir).ok();
    }
}
