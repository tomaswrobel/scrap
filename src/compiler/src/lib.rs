use wasm_bindgen::prelude::*;
mod swc_utils;
mod visitor;

#[wasm_bindgen]
pub fn parse(code: String) -> JsValue {
    return swc_utils::parse(code).map_or(JsValue::null(), |parsed| {
        serde_wasm_bindgen::to_value(&parsed).unwrap()
    });
}

#[wasm_bindgen]
pub fn transform(code: String) -> JsValue {
    return swc_utils::transform(code).map_or(JsValue::null(), |parsed| {
        serde_wasm_bindgen::to_value(&parsed).unwrap()
    });
}

#[wasm_bindgen(js_name = getVariables)]
pub fn get_variables(code: String) -> JsValue {
    return swc_utils::get_variables(code).map_or(JsValue::null(), |parsed| {
        serde_wasm_bindgen::to_value(&parsed).unwrap()
    });
}
