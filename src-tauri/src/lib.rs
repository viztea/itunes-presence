// Copyright 2019-2022 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::Serialize;
use tauri::{window::WindowBuilder, App, AppHandle, RunEvent, WindowUrl};

#[derive(Clone, Serialize)]
struct Reply {
    data: String,
}

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;
pub type OnEvent = Box<dyn FnMut(&AppHandle, RunEvent)>;

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
    on_event: Option<OnEvent>,
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
    where
        F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }

    #[must_use]
    pub fn on_event<F>(mut self, on_event: F) -> Self
    where
        F: Fn(&AppHandle, RunEvent) + 'static,
    {
        self.on_event.replace(Box::new(on_event));
        self
    }

    pub fn run(self) {
        let setup = self.setup;
        let mut on_event = self.on_event;

        #[allow(unused_mut)]
        let mut builder = tauri::Builder::default()
            .setup(move |app| {
                if let Some(setup) = setup {
                    (setup)(app)?;
                }

                #[allow(unused_mut)]
                let mut window_builder = WindowBuilder::new(app, "main", WindowUrl::default())
                    .user_agent("iTunes Companion")
                    .title("iTunes Companion");

                let window = window_builder.build();
                Ok(())
            })
            .on_page_load(|window, _| {
                let window_ = window.clone();
                window.listen("js-event", move |event| {
                    println!("got js-event with message '{:?}'", event.payload());
                    let reply = Reply {
                        data: "something else".to_string(),
                    };

                    window_
                        .emit("rust-event", Some(reply))
                        .expect("failed to emit");
                });
            });

        #[allow(unused_mut)]
        let mut app = builder
            .build(tauri::generate_context!())
            .expect("error while building tauri application");

        #[allow(unused_variables)]
        app.run(move |app_handle, e| {
            if let Some(on_event) = &mut on_event {
                (on_event)(app_handle, e);
            }
        })
    }
}
