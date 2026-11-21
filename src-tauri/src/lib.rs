use std::path::{Path, PathBuf};

use tauri::{Emitter, Manager};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Builder is Tauri's app bootstrap pipeline: plugins first, then command registration, then launch.
    tauri::Builder::default()
        // Must be registered first. Opening another file from Explorer while Markora is
        // running starts a second process; this hands its files to the first one and exits.
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let paths = commands::launch::document_paths(&args, Path::new(&cwd));
            open_in_running_app(app, paths);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        // Native open/save pickers. Rust opens them (see commands::file) so it knows
        // which files the user chose.
        .plugin(tauri_plugin_dialog::init())
        // Clipboard access is routed through Tauri so editor actions use the native desktop clipboard.
        .plugin(tauri_plugin_clipboard_manager::init())
        // In-app updates: the updater checks and installs signed releases; process relaunches afterwards.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // Shared state: the files the user has picked (read/write allowlist), remembered
        // across restarts so "restore previous session" can reopen them.
        .setup(|app| {
            let store = app.path().app_config_dir()?.join("allowed-paths.json");
            let allowed = commands::file::AllowedPaths::persistent(store);
            // Remembered files may have images next to them, so re-open their folders too.
            for path in allowed.paths() {
                commands::file::allow_images_near(app.handle(), &path);
            }
            app.manage(allowed);

            // Files the app was launched with ("Open with", double-click). The webview isn't
            // listening yet, so they wait here until the frontend asks for them.
            let args: Vec<String> = std::env::args().collect();
            let launch_paths = commands::launch::document_paths(&args, &std::env::current_dir()?);
            let pending = commands::launch::PendingOpens::default();
            pending.push(commands::launch::accept(app.handle(), &app.state(), launch_paths));
            app.manage(pending);
            Ok(())
        })
        // Register the commands that the frontend is allowed to invoke by name.
        .invoke_handler(tauri::generate_handler![
            commands::markdown::parse_markdown,
            commands::file::pick_open_path,
            commands::file::pick_save_path,
            commands::file::read_file,
            commands::file::write_file,
            commands::launch::take_pending_open_paths,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::settings::reset_settings,
            commands::whats_new::save_pending_whats_new,
            commands::whats_new::load_pending_whats_new,
            commands::whats_new::clear_pending_whats_new,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // macOS hands files to a running app as an event rather than as arguments.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = event {
                let paths = urls.iter().filter_map(|url| url.to_file_path().ok()).collect();
                open_in_running_app(app, paths);
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app, event);
        });
}

/// Allows `paths` and tells the already-running frontend to open them.
fn open_in_running_app(app: &tauri::AppHandle, paths: Vec<PathBuf>) {
    if paths.is_empty() {
        return;
    }
    let opened = commands::launch::accept(app, &app.state(), paths);
    if let Err(error) = app.emit("open-files", opened) {
        eprintln!("could not tell the window to open files: {error}");
    }
}
