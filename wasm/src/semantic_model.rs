use crate::query_builder::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Column {
    pub table: String,
    pub column: String,
    pub data_type: String,
    pub description: Option<String>,
}

impl PartialEq for Column {
    fn eq(&self, other: &Self) -> bool {
        self.column == other.column && self.data_type == other.data_type
    }
    
}

impl fmt::Display for Column {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}.\"{}\"", self.table, self.column)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Join {
    pub from_column: Column,
    pub to_column: Column,
}

impl fmt::Display for Join {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} = {}", self.from_column, self.to_column)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Table {
    pub name: String,
    pub description: Option<String>,
    pub columns: Vec<Column>,
    pub relationships: HashMap<String, Vec<Join>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticModel {
    pub name: String,
    pub tables: HashMap<String, Table>,
    pub relationships: Vec<Relationship>,
}

impl SemanticModel {
    pub fn add_update_table(&mut self, table_name: String, table: Table) {
        self.tables.insert(table_name, table);
    }

    pub fn delete_table(&mut self, table_name: String) {
        self.tables.remove(&table_name);
    }

    pub fn add_update_relationship(
        &mut self,
        from_table: String,
        to_table: String,
        joins: Vec<Join>,
    ) -> Result<(), String> {
        if !self.tables.contains_key(&from_table) || !self.tables.contains_key(&to_table) {
            return Err("Table does not exists".into());
        }

        let new_rel = Relationship {
            table_a: from_table.clone(),
            table_b: to_table.clone(),
            columns: joins.clone(),
        };
        for i in 0..self.relationships.len() {
            if new_rel == self.relationships[i] {
                self.relationships.remove(i);
            }
        }
        self.relationships.push(new_rel);

        if let Some(table) = self.tables.get_mut(&from_table) {
            table.relationships.insert(to_table.clone(), joins.clone());
        }
        if let Some(table) = self.tables.get_mut(&to_table) {
            table
                .relationships
                .insert(from_table.clone(), joins.clone());
        }
        Ok(())
    }

    pub fn delete_relationship(
        &mut self,
        from_table: String,
        to_table: String,
    ) -> Result<(), String> {
        let mut _x: Option<Vec<Join>> = None;
        match self.tables.get_mut(&from_table) {
            Some(table) => _x = table.relationships.remove(&to_table),
            None => _x = None,
        };

        match self.tables.get_mut(&to_table) {
            Some(table) => _x = table.relationships.remove(&to_table),
            None => _x = None,
        };

        if _x.is_none() {
            return Err(
                format!("No relationship between {} and {}", from_table, to_table).to_string(),
            );
        }
        Ok(())
    }

    pub fn parse_json_query(&self, query: Query) -> Result<String, String> {
        match sql_builder(query, self) {
            Ok(query) => Ok(query),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn set_name(&mut self, name: String) {
        self.name = name;
    }

    pub fn auto_detect_relationships(&self) -> Vec<Relationship> {
        let mut result: Vec<Relationship> = vec![];

        for (table_name, table) in &self.tables {
            let columns = table
                .clone()
                .columns
                .into_iter()
                .collect::<Vec<Column>>();

            for (target_table_name, target_table) in &self.tables {
                if target_table_name == table_name {
                    continue;
                }
                let mut joins = vec![];

                target_table
                    .clone()
                    .columns
                    .into_iter()
                    .for_each(|t_col| {
                        if let Some(col) = columns.iter().find(|s_col| s_col == &&t_col) {
                            joins.push(Join {from_column: col.clone(), to_column: t_col});
                        }
                    });

                let potential_rel = Relationship {
                    table_a: table_name.clone(),
                    table_b: target_table_name.clone(),
                    columns: joins.clone(),
                };

                if !self.relationships.contains(&potential_rel)
                    && !result.contains(&potential_rel)
                    && !joins.is_empty()
                {
                    result.push(potential_rel);
                }
            }
        }
        result
    }

    pub fn get_columns(&self, table_name: String) -> Result<Vec<Column>, String> {
        match self.tables.get(&table_name) {
            Some(table) => Ok(table.columns.clone()),
            None => Err(format!("No table called {}", table_name)),
        }
    }

    pub fn get_table_relationships(&self, table_name: String) -> Result<Vec<String>, String> {
        match self.tables.get(&table_name) {
            Some(t) => Ok(t.relationships.keys().map(|rel| rel.to_string()).collect::<Vec<String>>()),
            None => Err(format!("No table called {}", table_name)),
        }
    }

    pub fn get_relationship(&self, table_a: String, table_b: String) -> Result<Vec<Join>, String> {
        match self.tables.get(&table_a) {
            Some(source) => {
                match source.relationships.get(&table_b) {
                    Some(target) => Ok(target.clone()),
                    None => Err(format!("Table {} does not have a relationship to {}", table_a, table_b))
                }
            },
            None => Err(format!("No table called {}", table_a)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Relationship {
    table_a: String,
    table_b: String,
    columns: Vec<Join>,
}

impl PartialEq for Relationship {
    fn eq(&self, other: &Self) -> bool {
        (self.table_a == other.table_a && self.table_b == other.table_b)
            || (self.table_a == other.table_b && self.table_b == other.table_a)
    }
}
