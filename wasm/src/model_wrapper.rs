use std::collections::HashMap;

use serde_json::Error;
use wasm_bindgen::prelude::*;
use web_sys::*;

use crate::semantic_model::*;

fn load_model_from_json(json_model: String) -> Result<SemanticModel, Error> {
    match serde_json::from_str::<SemanticModel>(&json_model) {
        Ok(model) => return Ok(model),
        Err(err) => return Err(err),
    }
}

fn create_json_from_model(model: SemanticModel) -> Result<String, js_sys::Error> {
    match serde_json::to_string(&model) {
        Ok(string) => Ok(string),
        Err(e) => Err(js_sys::Error::new(&e.to_string())),
    }
}

#[wasm_bindgen]
pub fn add_table(
    json_model: String,
    table_name: String,
    jsoncolumns: String,
    description: Option<String>,
) -> Result<String, js_sys::Error> {
    let mut model = match load_model_from_json(json_model) {
        Ok(model) => model,
        Err(e) => return Err(js_sys::Error::new(&e.to_string())),
    };

    let columns: Vec<Column>;
    match serde_json::from_str::<Vec<Column>>(&jsoncolumns) {
        Ok(cols) => columns = cols,
        Err(e) => return Err(js_sys::Error::new(&e.to_string())),
    }

    let relationships = HashMap::new();
    let table = Table {
        name: table_name.clone(),
        description: description,
        columns: columns,
        relationships: relationships,
    };
    model.add_update_table(table_name, table);
    create_json_from_model(model)
}

#[wasm_bindgen]
pub fn delete_table(json_model: String, table_name: String) -> Result<String, js_sys::Error> {
    let mut model = match load_model_from_json(json_model) {
        Ok(model) => model,
        Err(e) => return Err(js_sys::Error::new(&e.to_string())),
    };

    model.delete_table(table_name);

    create_json_from_model(model)
}

#[wasm_bindgen]
pub fn add_update_relationship(
    json_model: String,
    from_table: String,
    to_table: String,
    from_columns: Vec<String>,
    to_columns: Vec<String>,
) -> Result<String, js_sys::Error> {
    let mut model = match load_model_from_json(json_model) {
        Ok(model) => model,
        Err(e) => return Err(js_sys::Error::new(&e.to_string())),
    };

    match model.add_update_relationship(from_table, to_table, from_columns, to_columns) {
        Ok(()) => (),
        Err(e) => return Err(js_sys::Error::new(&e)),
    };

    create_json_from_model(model)
}

#[wasm_bindgen]
pub fn delete_relationship(
    json_model: String,
    from_table: String,
    to_table: String,
) -> Result<String, js_sys::Error> {
    let mut model = match load_model_from_json(json_model) {
        Ok(model) => model,
        Err(e) => return Err(js_sys::Error::new(&e.to_string())),
    };

    match model.delete_relationship(from_table, to_table) {
        Ok(()) => (),
        Err(e) => return Err(js_sys::Error::new(&e)),
    };

    create_json_from_model(model)
}
