#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod desktop;

use desktop::create_app;
use tauri::*;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    create_app();
    // let tray = SystemTray::new();

    // tauri::Builder::default()
    //     .system_tray(tray)
    //     .on_system_tray_event(|app, event| match event {
    //         SystemTrayEvent::LeftClick {
    //             tray_id,
    //             position,
    //             size,
    //             ..
    //         } => {
    //             if let Some(window) = app.get_window("main") {
    //                 window.show().unwrap();
    //                 window.set_focus().unwrap();
    //             } else {
    //             }
    //         }

    //         _ => {}
    //     })
    //     .invoke_handler(tauri::generate_handler![greet])
    //     .build(tauri::generate_context!())
    //     .expect("error while building tauri application")
    //     .run(|_app_handle, event| match event {
    //         tauri::RunEvent::ExitRequested { api, .. } => {
    //             api.prevent_exit();
    //         }
    //         _ => {}
    //     });
}
