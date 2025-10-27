/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview WASM entry point
 * @copyright Tomáš Wróbel 2025
 */
use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use wasm_bindgen::prelude::*;
mod swc_utils;
mod visitor;

#[wasm_bindgen]
pub fn parse(code: String) -> JsValue {
    let serializer = Serializer::json_compatible();

    return swc_utils::parse(code).map_or(JsValue::null(), |parsed| {
        parsed.serialize(&serializer).unwrap()
    });
}

#[wasm_bindgen]
pub fn transform(code: String) -> JsValue {
    let serializer = Serializer::json_compatible();

    return swc_utils::transform(code).map_or(JsValue::null(), |parsed| {
        parsed.serialize(&serializer).unwrap()
    });
}

#[wasm_bindgen(js_name = getVariables)]
pub fn get_variables(code: String) -> JsValue {
    let serializer = Serializer::json_compatible();

    return swc_utils::get_variables(code).map_or(JsValue::null(), |parsed| {
        parsed.serialize(&serializer).unwrap()
    });
}
