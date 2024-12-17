mod model_wrapper;
mod query_builder;
mod semantic_model;
mod statics;

use core::str;
use wasm_bindgen::prelude::*;
use web_sys::*;

#[wasm_bindgen]
pub fn sql_parser_autocomplete(query: String, tables: Vec<String>, cursor_loc: usize) -> String {
    let split_query: Vec<_> = query.split_whitespace().collect();
    let mut result_query = query.clone().split_at_mut(cursor_loc - 1).0.to_string();
    let word_count = split_query.len();

    for table in &tables {
        let table_identifiers: Vec<_> = split_query
            .iter()
            .enumerate()
            .filter_map(|(index, &word)| {
                if word.to_lowercase() == table.to_lowercase() {
                    Some(index)
                } else {
                    None
                }
            })
            .collect();
        for i in table_identifiers {
            if i >= word_count {
                continue;
            }
            let mut index = i + 1;
            if split_query[i + 1] == "as" {
                index += 1;
            }
            let identifier: &str = &split_query[index].to_lowercase();
            if !statics::DUCKDB_KEYWORDS.contains(&identifier) {
                result_query =
                    result_query.replace(&format!(" {identifier}."), &format!(" {table}."));
            }
        }
    }

    result_query
}
