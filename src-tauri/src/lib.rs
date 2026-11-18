mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Builder is Tauri's app bootstrap pipeline: plugins first, then command registration, then launch.
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Native open/save pickers. Rust opens them (see commands::file) so it knows
        // which files the user chose.
        .plugin(tauri_plugin_dialog::init())
        // Clipboard access is routed through Tauri so editor actions use the native desktop clipboard.
        .plugin(tauri_plugin_clipboard_manager::init())
        // Shared state: the files the user picked this session (read/write allowlist).
        .manage(commands::file::AllowedPaths::default())
        // Register the commands that the frontend is allowed to invoke by name.
        .invoke_handler(tauri::generate_handler![
            commands::markdown::parse_markdown,
            commands::file::pick_open_path,
            commands::file::pick_save_path,
            commands::file::read_file,
            commands::file::write_file,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::settings::reset_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
