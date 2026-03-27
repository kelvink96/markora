// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // main.rs stays intentionally thin: it just boots the library crate.
    markora_lib::run()
}
