use std::fs;

// Reads UTF-8 text from disk and returns either the file contents or an error string.
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    // Convert Rust's io::Error into a plain String so it crosses the Tauri boundary cleanly.
    fs::read_to_string(&path).map_err(|error| error.to_string())
}

// Writes UTF-8 text to disk, creating or overwriting the target file.
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    // Result<(), String> means "either success with no payload, or an error message".
    fs::write(&path, content).map_err(|error| error.to_string())
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

    #[test]
    fn test_read_file() {
        let path = tmp("markora_read_test.md");
        fs::write(&path, "# Test Content").unwrap();
        let result = read_file(path.clone());
        assert_eq!(result.unwrap(), "# Test Content");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_write_file() {
        let path = tmp("markora_write_test.md");
        let result = write_file(path.clone(), "# Written".to_string());
        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&path).unwrap(), "# Written");
        fs::remove_file(&path).ok();
    }

    #[test]
    fn test_read_missing_file_returns_err() {
        let result = read_file("/nonexistent/path/file.md".to_string());
        assert!(result.is_err());
    }
}
