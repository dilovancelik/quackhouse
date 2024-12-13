import { initDB } from './duckdb';
import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { Grid } from 'gridjs';
import "gridjs/dist/theme/mermaid.css";
import type { Table } from 'apache-arrow';

const processInputFiles = async (tables: HTMLElement) => {
    try {
        const db = await initDB();
        const files = (<HTMLInputElement>document.getElementById("file")!).files!;
        [...Array(files?.length).keys()].forEach(async (i: number) => {
            const file = files[i];
            let res = await createTable(file, db);
            tables.appendChild(res);
        });
    } catch (error) {
        tables.appendChild(errorToHTML(error as Error));
    }
};

const createTable = async (file: File, db: AsyncDuckDB): Promise<HTMLElement> => {
    let return_html: HTMLElement;

    try {
        var file_name_array = file.name.split(".");
        const ext: string | undefined = file_name_array.pop();
        const table_name: string | undefined = file_name_array.join("").replaceAll(" ", "_").replaceAll("-", "_");
        const content = await file.arrayBuffer();

        await db.registerFileBuffer(`/${file.name}`, new Uint8Array(content))

        var create_query: string = "";

        if (ext === "csv") {
            create_query = `CREATE TABLE ${table_name} AS FROM read_csv_auto('/${file.name}', header = true)`;
        } else if (ext === "json") {
            create_query = `CREATE TABLE ${table_name} AS FROM read_json_auto('/${file.name}')`;
        } else if (ext === "parquet") {
            create_query = `CREATE TABLE ${table_name} AS FROM read_parquet('/${file.name}')`;
        };

        const conn = await db.connect();
        try {
            await conn.query(create_query);
            const result = await conn.query(`SUMMARIZE ${table_name};`);
            return_html = arrowToHTML(result, table_name);
        } catch (error) {
            return_html = errorToHTML(error as Error);
        } finally {
            conn.close();
        }

    } catch (error) {
        return_html = errorToHTML(error as Error);
    }
    console.log(return_html)
    return return_html;
}


const arrowToHTML = (result: Table<any>, table_name: string): HTMLElement => {
    const data = JSON.parse(result.toString());
    const table_definition = document.createElement("details");
    const wrapper = document.createElement("div");
    const table_header = document.createElement("summary");
    table_header.innerText = table_name;
    table_definition.appendChild(table_header);
    table_definition.appendChild(wrapper);

    const columns = [
        { id: 'column_name', name: 'Name' },
        { id: "column_type", name: "Type" },
        { id: 'null_percentage', name: 'NULL %' },
        { id: 'approx_unique', name: 'Unique' },
        { id: 'min', name: 'Min' },
        { id: 'max', name: 'Max' },
        { id: 'avg', name: 'Average' },
        { id: 'q50', name: 'Median' },
        { id: 'std', name: 'Std Dev.' },
        { id: 'q25', name: 'Q. 25' },
        { id: 'q75', name: 'Q. 75' },
        { id: 'count', name: 'Rowcount', hidden: true },
    ]
    new Grid({
        columns: columns,
        style: {
            table: {
                'white-space': 'nowrap'
            }
        },
        pagination: {
            limit: 10
        },
        data: data,
        sort: true,
        resizable: true
    }).render(wrapper);

    return table_definition;
}

const errorToHTML = (error: Error): HTMLElement => {
    const htmlError = document.createElement("small");
    htmlError.innerHTML = error.message.split("\n").map((line) => "> " + line).join("<br/>");
    htmlError.classList.add("error");
    return htmlError;
}

export { processInputFiles };