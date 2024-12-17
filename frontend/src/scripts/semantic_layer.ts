
class Database {
    name: string;
    tables: Tables;

    constructor(name: string, tables: Tables) {
        this.name = name;
        this.tables = tables;
    }
}

class Tables {
    [index: string]: Table;
}

class Table {
    name: string;
    desciption: string;
    columns: Column[];
    relationships: Relationships;

    constructor(name: string, desciption: string, columns: Column[], relationships: Relationships) {
        this.name = name;
        this.desciption = desciption;
        this.columns = columns;
        this.relationships = relationships;
    }
}

class Column {
    table: string;
    column: string;
    data_type: string;
    description: string;

    constructor(table: string, column: string, data_type: string, description: string) {
        this.table = table;
        this.column = column;
        this.data_type = data_type;
        this.description = description;
    }
}

class Relationships {
    [index: string]: Join[];
}

class Join {
    from_columns: string;
    to_columns: string;

    constructor(from_columns: string, to_columns: string) {
        this.from_columns = from_columns;
        this.to_columns = to_columns;
    }
}

var semantic_model: Database;

const init_semantic_model = (name?: string): Database => {

    if (semantic_model) {
        return semantic_model;
    }

    const model_name = name ?? crypto.randomUUID();
    semantic_model = new Database(model_name, new Tables());
    return semantic_model;
}

export { Database, init_semantic_model }