use serde::Deserialize;
use serde::Serialize;
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
            relationships: vec![],
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

        let columns: Vec<Column> = match serde_json::from_str::<Vec<Column>>(&jsoncolumns) {
            Ok(cols) => cols,
            Err(e) => return Err(JsError::new(&e.to_string())),
        };

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
        json_joins: String,
    ) -> Result<String, JsError> {
        let mut model = self.model.borrow_mut();

        let wasm_joins = match serde_json::from_str::<Vec<(ColumnWasm, ColumnWasm)>>(&json_joins) {
            Ok(val) => val,
            Err(e) => return Err(JsError::new(&e.to_string())),
        };

        let mut joins = vec![];
        
        wasm_joins.iter().for_each(|j| {
            let _from_table = model.tables.get(&from_table).unwrap();

            let from_dummy_col = Column {
                table: "dummy".to_string(),
                column: j.0.name.clone(),
                data_type: j.0.data_type.clone(),
                description: None,
            };
            let from_col = _from_table.columns.iter().find(|c| c == &&from_dummy_col).unwrap();
            
            let _to_table = model.tables.get(&to_table).unwrap();
            let to_dummy_col = Column {
                table: "dummy".to_string(),
                column: j.1.name.clone(),
                data_type: j.1.data_type.clone(),
                description: None,
            };
            let to_col = _to_table.columns.iter().find(|c| c == &&to_dummy_col).unwrap();

            joins.push(Join { from_column: from_col.clone(), to_column: to_col.clone() });
        });

        match model.add_update_relationship(from_table.clone(), to_table.clone(), joins) {
            Ok(()) => Ok(format!(
                "Relationship between {} and {} successfully created",
                from_table, to_table
            )),
            Err(e) => Err(JsError::new(&e)),
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
            Err(e) => Err(JsError::new(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn parse_json_query(&self, query: Query) -> Result<String, JsError> {
        let model = self.model.borrow();

        match model.parse_json_query(query) {
            Ok(query) => Ok(query),
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

    #[wasm_bindgen]
    pub fn get_cytoscape_elements(&self) -> Result<String, JsError> {
        let model = self.model.borrow();

        let mut elements: Vec<CytoscapeElement> = vec![];

        model.tables.values().for_each(|table| {
            elements.push(CytoscapeElement {
                data: CytoscapeData {
                    id: table.name.clone(),
                    source: None,
                    target: None,
                },
            });
            table.relationships.keys().for_each(|to_table| {
                elements.push(CytoscapeElement {
                    data: CytoscapeData {
                        id: format!("{}_{}", table.name, to_table),
                        source: Some(table.name.clone()),
                        target: Some(to_table.clone()),
                    },
                });
            });
        });
        match serde_json::to_string(&elements) {
            Ok(json) => Ok(json),
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }

    #[wasm_bindgen]
    pub fn set_name(&mut self, name: String) {
        let mut model = self.model.borrow_mut();
        model.set_name(name);
    }

    #[wasm_bindgen]
    pub fn get_name(&self) -> String {
        let model = self.model.borrow();
        model.name.clone()
    }

    #[wasm_bindgen]
    pub fn auto_detect_relationships(&self) -> Result<String, JsError> {
        let model = self.model.borrow();
        let potential_relationsships = model.auto_detect_relationships();
        match serde_json::to_string(&potential_relationsships) {
            Ok(json) => Ok(json),
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }

    #[wasm_bindgen]
    pub fn get_columns(&self, table_name: String) -> Result<String, JsError> {
        let model = self.model.borrow();

        match model.get_columns(table_name) {
            Ok(columns) => {
                let res = columns
                    .iter()
                    .map(|col| ColumnWasm {
                        name: col.column.clone(),
                        data_type: col.data_type.clone(),
                    })
                    .collect::<Vec<ColumnWasm>>();
                match serde_json::to_string(&res) {
                    Ok(json) => Ok(json),
                    Err(e) => Err(JsError::new(e.to_string().as_str())),
                }
            }
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }

    #[wasm_bindgen]
    pub fn get_table_names(&self) -> Vec<String> {
        let model = self.model.borrow();
        model
            .tables
            .keys()
            .map(|t| t.to_string())
            .collect::<Vec<String>>()
    }

    #[wasm_bindgen]
    pub fn get_table_relationships(&self, table: String) -> Result<Vec<String>, JsError> {
        let model = self.model.borrow();

        match model.get_table_relationships(table) {
            Ok(tables) => Ok(tables),
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }

    #[wasm_bindgen]
    pub fn get_relationship(&self, table_a: String, table_b: String) -> Result<String, JsError> {
        let model = self.model.borrow();

        match model.get_relationship(table_a, table_b) {
            Ok(rel) => match serde_json::to_string(&rel) {
                Ok(json) => Ok(json),
                Err(e) => Err(JsError::new(e.to_string().as_str())),
            },
            Err(e) => Err(JsError::new(e.to_string().as_str())),
        }
    }
}

#[derive(Serialize, Deserialize)]
struct CytoscapeElement {
    data: CytoscapeData,
}

#[derive(Serialize, Deserialize)]
struct CytoscapeData {
    id: String,
    source: Option<String>,
    target: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ColumnWasm {
    name: String,
    data_type: String,
}
