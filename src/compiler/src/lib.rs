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
mod oxc_utils;
mod visitor;

#[wasm_bindgen]
pub fn parse(code: String) -> JsValue {
    return oxc_utils::parse(&code)
        .and_then(|json| js_sys::JSON::parse(&json).ok())
        .unwrap_or(JsValue::NULL);
}

#[wasm_bindgen]
pub fn transform(code: String) -> JsValue {
    return oxc_utils::transform(&code).map_or(JsValue::NULL, JsValue::from);
}

#[wasm_bindgen(js_name = getVariables)]
pub fn get_variables(code: String) -> JsValue {
    let serializer = Serializer::json_compatible();

    return oxc_utils::get_variables(&code).map_or(JsValue::NULL, |parsed| {
        parsed.serialize(&serializer).unwrap()
    });
}
