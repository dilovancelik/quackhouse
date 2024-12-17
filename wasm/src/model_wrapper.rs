use std::{cell::RefCell, collections::HashMap};
use wasm_bindgen::prelude::*;
use web_sys::*;

use crate::query_builder::*;
use crate::semantic_model::*;

#[derive(serde::Serialize)]
#[wasm_bindgen]
pub struct SemanticModelHandle {
    model: RefCell<SemanticModel>,
}

#[wasm_bindgen]
impl SemanticModelHandle {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String) -> SemanticModelHandle {
        let model = SemanticModel {
            name,
            tables: HashMap::new(),
        };
        SemanticModelHandle {
            model: RefCell::new(model),
        }
    }

    #[wasm_bindgen]
    pub fn add_table(
        &self,
        table_name: String,
        jsoncolumns: String,
        description: Option<String>,
    ) -> Result<String, JsError> {
        let mut model = self.model.borrow_mut();

        let columns: Vec<Column>;
        match serde_json::from_str::<Vec<Column>>(&jsoncolumns) {
            Ok(cols) => columns = cols,
            Err(e) => return Err(JsError::new(&e.to_string())),
        }

        let relationships = HashMap::new();
        let table = Table {
            name: table_name.clone(),
            description,
            columns,
            relationships,
        };
        model.add_update_table(table_name.clone(), table);
        Ok(format!("Table: {} added to semantic model", table_name))
    }

    #[wasm_bindgen]
    pub fn delete_table(&self, table_name: String) -> Result<String, JsError> {
        let mut model = self.model.borrow_mut();

        model.delete_table(table_name.clone());

        Ok(format!("Table {} successfully deleted", table_name))
    }

    #[wasm_bindgen]
    pub fn add_update_relationship(
        &self,
        from_table: String,
        to_table: String,
        from_columns: Vec<String>,
        to_columns: Vec<String>,
    ) -> Result<String, JsError> {
        let mut model = self.model.borrow_mut();

        match model.add_update_relationship(
            from_table.clone(),
            to_table.clone(),
            from_columns,
            to_columns,
        ) {
            Ok(()) => Ok(format!(
                "Relationship between {} and {} successfully created",
                from_table, to_table
            )),
            Err(e) => return Err(JsError::new(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn delete_relationship(
        &self,
        from_table: String,
        to_table: String,
    ) -> Result<String, JsError> {
        let mut model = self.model.borrow_mut();

        match model.delete_relationship(from_table.clone(), to_table.clone()) {
            Ok(()) => Ok(format!(
                "Relationship between {} and {} successfully deleted",
                from_table, to_table
            )),
            Err(e) => return Err(JsError::new(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn parse_json_query(&self, query: Query) -> Result<String, JsError> {
        let model = self.model.borrow();

        match model.parse_json_query(query) {
            Ok(query) => return Ok(query),
            Err(e) => return Err(JsError::new(e.to_string().as_str())),
        }
    }

    #[wasm_bindgen]
    pub fn download_model(&self) -> Result<String, JsError> {
        let model = self.model.borrow().clone();
        match serde_json::to_string(&model) {
            Ok(model) => Ok(model),
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }
}
