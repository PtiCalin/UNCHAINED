#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager};
use tauri::tray::{TrayIconBuilder, MenuBuilder, MenuItem};

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let open = MenuItem::with_id(app, "open_library", "Open Library", true, None::<&str>)?;
      let import = MenuItem::with_id(app, "import_folder", "Import Folder", true, None::<&str>)?;
      let check_update = MenuItem::with_id(app, "check_update", "Check for Updates", true, None::<&str>)?;
      let exit = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;
      let menu = MenuBuilder::new(app)
        .item(&open)
        .item(&import)
        .item(&check_update)
        .separator()
        .item(&exit)
        .build()?;

      TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| {
          match event.id().as_ref() {
            "open_library" => {
              let _ = app.emit("tray://open-library", ());
            }
            "import_folder" => {
              let _ = app.emit("tray://import-folder", ());
            }
            "check_update" => {
              // attempt updater check
              if let Some(updater) = app.updater() {
                if let Err(e) = updater.check() {
                  let _ = app.emit("update://status", format!("Update check failed: {e}"));
                } else {
                  let _ = app.emit("update://status", "Update check initiated".to_string());
                }
              } else {
                let _ = app.emit("update://status", "Updater not available".to_string());
              }
            }
            "exit" => {
              app.exit(0);
            }
            _ => {}
          }
        })
        .build(app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
