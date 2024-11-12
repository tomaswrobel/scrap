//!
//! This file is a part of Scrap, an educational programming language.
//! You should have received a copy of the MIT License, if not, please
//! visit https://opensource.org/licenses/MIT. To verify the code, visit
//! the official repository at https://github.com/tomas-wrobel/scrap.
//! 
//! license: MIT
//! copyright: Tomáš Wróbel 2024
//!
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    scrap_native_lib::run()
}
