mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Builder is Tauri's app bootstrap pipeline: plugins first, then command registration, then launch.
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // The dialog plugin gives the frontend access to native open/save pickers.
        .plugin(tauri_plugin_dialog::init())
        // Register the commands that the frontend is allowed to invoke by name.
        .invoke_handler(tauri::generate_handler![
            commands::markdown::parse_markdown,
            commands::file::read_file,
            commands::file::write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
