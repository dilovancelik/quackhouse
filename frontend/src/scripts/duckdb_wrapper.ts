import { initDB } from './duckdb';
import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { Grid } from 'gridjs';

import { ApexGrid } from 'apex-grid';
ApexGrid.register();

import type { Table } from 'apache-arrow';

import { initModel } from './semantic_layer';

import { SemanticModelHandle } from '../../public/wasm/wasm';
import { createMap } from './model_visualiser';

const createTablesFromFiles = async (files: FileList) => {
    var loaded_files = 0;
    sessionStorage.setItem("total_files", files.length.toString());
    sessionStorage.setItem("loaded_files", loaded_files.toString());

    var progress_bar = document.getElementById("progress_bar")!;
    progress_bar.dispatchEvent(new CustomEvent("progress_bar_display_update", { detail: "flex" }));

    const creation_event = new CustomEvent("table_creation_event");
    var model = initModel(null);
    try {
        const db = await initDB();
        [...Array(files.length).keys()].forEach(async (i: number) => {
            const file = files[i];
            let res = await createDuckDBTable(file, db, model);
            loaded_files += 1;
            sessionStorage.setItem("loaded_files", (loaded_files).toString())
            sessionStorage.setItem(`table_${res[0]}`, res[1].outerHTML)
            if (loaded_files === files.length) {
                progress_bar.dispatchEvent(new CustomEvent("table_creation_finished"));
                createMap(model);
            } else {
                progress_bar.dispatchEvent(creation_event);
            }
        });
        (<HTMLButtonElement>document.getElementById("open_relationship"))!.disabled = false;
    } catch (error) {
        console.log(errorToHTML(error as Error));
    }

};

const createDuckDBTable = async (file: File, db: AsyncDuckDB, model: SemanticModelHandle): Promise<[string, HTMLElement]> => {
    let return_html: HTMLElement;
    let name: string;

    try {
        var file_name_array = file.name.split(".");
        const ext: string | undefined = file_name_array.pop();
        const table_name: string | undefined = file_name_array.join("").replaceAll(" ", "_").replaceAll("-", "_");
        name = table_name;
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
            const columns = JSON.stringify(
                result
                    .toArray()
                    .map((col) => {
                        return {
                            table: table_name,
                            column: col["column_name"],
                            data_type: col["column_type"],
                            description: col["column_name"]
                        }
                    })
            );
            model.add_table(table_name, columns);
            return_html = arrowToHTML(result, table_name);
        } catch (error) {
            return_html = errorToHTML(error as Error);
        } finally {
            conn.close();
        }

    } catch (error) {
        name = "Error";
        return_html = errorToHTML(error as Error);
    }
    return [name, return_html];
}

/*
const executeQuery = async (query: Query): HTMLElement => {
    let db = await initDB();
    let model = initModel(null);
    const duckdb_query = model.parse_json_query(query);

    let result_html: HTMLElement;
    await db.connect()
        .then((conn) => {
            conn.query(duckdb_query)
                .then((result) => { result_html = arrowToHTML(result, "Result") })
                .catch((error) => { result_html = errorToHTML(error) })
                .finally(() => { conn.close() })
        })
        .catch((error) => { result_html = errorToHTML(error) });

    return result_html;
}
*/

const arrowToHTML = (result: Table<any>, table_name: string): HTMLElement => {
    const data = JSON.parse(result.toString());

    const table_definition = document.createElement("div");
    const wrapper = document.createElement("div");
    const table_header = document.createElement("h3");

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
            td: {
                'min-width': '150px'
            },
            table: {
                'white-space': 'nowrap'
            }
        },

        pagination: {
            limit: 10
        },
        data: data,
        sort: true,
        fixedHeader: true
    }).render(wrapper);

    return table_definition;
}

const errorToHTML = (error: Error): HTMLElement => {
    const htmlError = document.createElement("small");
    htmlError.innerHTML = error.message.split("\n").map((line) => "> " + line).join("<br/>");
    htmlError.classList.add("error");
    return htmlError;
}

export { createTablesFromFiles, arrowToHTML };
