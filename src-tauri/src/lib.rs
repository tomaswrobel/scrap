//!
//! This file is a part of Scrap, an educational programming language.
//! You should have received a copy of the MIT License, if not, please
//! visit https://opensource.org/licenses/MIT. To verify the code, visit
//! the official repository at https://github.com/tomas-wrobel/scrap.
//!
//! license: MIT
//! copyright: Tomáš Wróbel 2024
//!
mod swc_utils;
mod visitor;

#[tauri::command]
fn parse(code: String) -> Result<swc_utils::Parsed, ()> {
    return swc_utils::parse(code);
}

#[tauri::command]
fn transform(code: String) -> Result<String, ()> {
    return swc_utils::transform(code).map_err(|_| ());
}

#[tauri::command]
fn variables(code: String) -> Result<Vec<(String, Vec<String>)>, ()> {
    return swc_utils::get_variables(code);
}

#[tauri::command]
fn fill(
    image_data: Vec<u8>,
    target_r: u8,
    target_g: u8,
    target_b: u8,
    target_a: u8,
    color: String,
    x: usize,
    y: usize,
) -> Vec<u8> {
    let mut stack = vec![(x, y)];
    let mut data = image_data.clone();

    let r = u8::from_str_radix(&color[1..3], 16).unwrap();
    let g = u8::from_str_radix(&color[3..5], 16).unwrap();
    let b = u8::from_str_radix(&color[5..7], 16).unwrap();

    while stack.len() > 0 {
        let (x, y) = stack.pop().unwrap();
        let index = (y * 480 + x) * 4;

        if data[index + 3] == 0 {
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255;
        }

        if data[index] == target_r
            && data[index + 1] == target_g
            && data[index + 2] == target_b
            && data[index + 3] == target_a
        {
            data[index + 3] = 0;

            if x > 0 {
                stack.push((x - 1, y));
            }

            if x < 479 {
                stack.push((x + 1, y));
            }

            if y > 0 {
                stack.push((x, y - 1));
            }

            if y < 359 {
                stack.push((x, y + 1));
            }
        }
    }

    return data;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![parse, transform, variables, fill])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
