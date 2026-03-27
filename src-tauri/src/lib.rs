mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Register the commands that the frontend is allowed to invoke by name.
        .invoke_handler(tauri::generate_handler![commands::markdown::parse_markdown])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
