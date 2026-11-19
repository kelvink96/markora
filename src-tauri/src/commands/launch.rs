use std::mem;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::{AppHandle, State};

use super::file::{allow_images_near, AllowedPaths};

/// Files the OS asked us to open ("Open with", double-click, `markora file.md`) before
/// the webview was ready to hear about them. The frontend drains them once at startup.
#[derive(Default)]
pub struct PendingOpens(Mutex<Vec<String>>);

impl PendingOpens {
    pub fn push(&self, paths: Vec<String>) {
        if let Ok(mut pending) = self.0.lock() {
            pending.extend(paths);
        }
    }

    pub fn take(&self) -> Vec<String> {
        self.0.lock().map(|mut pending| mem::take(&mut *pending)).unwrap_or_default()
    }
}

/// The existing files named in a command line. `args[0]` is the program itself and
/// anything starting with `-` is a flag; relative paths resolve against `cwd`.
pub fn document_paths(args: &[String], cwd: &Path) -> Vec<PathBuf> {
    args.iter()
        .skip(1)
        .filter(|arg| !arg.starts_with('-'))
        .map(|arg| cwd.join(arg)) // an absolute `arg` replaces `cwd` here
        .filter(|path| path.is_file())
        .collect()
}

/// Lets the user-chosen files be read, written and shown with their images, exactly as
/// if they had been picked in a dialog, and returns them as strings for the frontend.
pub fn accept(app: &AppHandle, allowed: &AllowedPaths, paths: Vec<PathBuf>) -> Vec<String> {
    paths
        .into_iter()
        .filter_map(|path| {
            if let Err(error) = allowed.allow(&path) {
                eprintln!("could not open {}: {error}", path.display());
                return None;
            }
            allow_images_near(app, &path);
            Some(path.to_string_lossy().into_owned())
        })
        .collect()
}

// Hands over (and forgets) the files the app was launched with.
#[tauri::command]
pub fn take_pending_open_paths(pending: State<'_, PendingOpens>) -> Vec<String> {
    pending.take()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn unique_dir(label: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("markora-launch-{label}-{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn args(items: &[&str]) -> Vec<String> {
        items.iter().map(|item| item.to_string()).collect()
    }

    #[test]
    fn test_the_program_name_is_not_a_document() {
        let dir = unique_dir("program");
        let program = dir.join("markora.exe");
        fs::write(&program, "").unwrap();

        assert!(document_paths(&args(&[program.to_str().unwrap()]), &dir).is_empty());
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_existing_files_are_opened_in_order() {
        let dir = unique_dir("files");
        let (a, b) = (dir.join("a.md"), dir.join("b.markdown"));
        fs::write(&a, "# A").unwrap();
        fs::write(&b, "# B").unwrap();

        let found = document_paths(&args(&["markora", a.to_str().unwrap(), b.to_str().unwrap()]), &dir);

        assert_eq!(found, vec![a, b]);
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_flags_missing_files_and_folders_are_ignored() {
        let dir = unique_dir("ignored");
        let folder = dir.join("folder");
        fs::create_dir_all(&folder).unwrap();

        let found = document_paths(
            &args(&["markora", "--inspect", folder.to_str().unwrap(), dir.join("missing.md").to_str().unwrap()]),
            &dir,
        );

        assert!(found.is_empty());
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_relative_paths_resolve_against_the_working_directory() {
        let dir = unique_dir("relative");
        fs::write(dir.join("notes.md"), "# Notes").unwrap();

        let found = document_paths(&args(&["markora", "notes.md"]), &dir);

        assert_eq!(found, vec![dir.join("notes.md")]);
        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn test_pending_opens_are_handed_over_once() {
        let pending = PendingOpens::default();
        pending.push(vec!["/a.md".into()]);
        pending.push(vec!["/b.md".into()]);

        assert_eq!(pending.take(), vec!["/a.md", "/b.md"]);
        assert!(pending.take().is_empty());
    }
}
