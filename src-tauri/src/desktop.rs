use itunes_presence::AppBuilder;
use tauri::{App, SystemTray};

pub fn create_app() {
    AppBuilder::new()
        .setup(|app| {
            setup_tray(app);
            Ok(())
        })
        .run();
}

fn setup_tray(app: &mut App) {
    SystemTray::new()
        .with_id("itunes-companion".to_string())
        .build(app)
        .unwrap();
}
