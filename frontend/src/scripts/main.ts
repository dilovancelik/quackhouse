import { SemanticModelHandle } from "../../public/wasm/wasm";
import "../styles/gridjs.css";
import "../styles/style.css";

import { createTablesFromFiles } from "./duckdb_wrapper";
import { createMap } from "./model_visualiser";
import { initModel } from "./semantic_layer";

const processInputFiles = async () => {
    const files = (<HTMLInputElement>document.getElementById("files")!).files!;
    await createTablesFromFiles(files);
};

const generateTableRelationshipDiv = (id: string): HTMLDivElement => {
    const model = initModel(null);

    const div = document.createElement("div");
    div.classList.add("table_group");

    const potential_tables = model.get_table_names();
    const table_list = document.createElement("select");
    table_list.id = `table_${id}`;
    const header_option = document.createElement("option");
    header_option.innerText = "Select a Table";
    header_option.disabled = true;
    header_option.selected = true;

    table_list.appendChild(header_option);

    potential_tables.forEach((table) => {
        const option = document.createElement("option");
        option.value = table;
        option.innerText = table;
        table_list.appendChild(option);
    });

    table_list.style.width = "90%";
    div.appendChild(table_list);

    table_list.addEventListener("change", () => {
        div.querySelectorAll("ul").forEach((e) => e.remove());
        const column_list = get_columns(table_list.value);
        column_list.id = `columns_${id}`;
        div.appendChild(column_list);

        const other_table_id = id === "a" ? "table_b" : "table_a";
        const other_table = document.getElementById(other_table_id)!;
        const active_relationships = model.get_table_relationships(table_list.value);
        other_table.querySelectorAll("option").forEach((table) => {
            table.disabled = false;
            if (active_relationships.includes(table.value)) {
                table.disabled = true;
                table.selected = false;
            }

            if (table.value === table_list.value) {
                table.disabled = true;
                table.selected = false;
            }
        });
    });
    table_list.dispatchEvent(new Event("change"));

    return div;
};

const get_columns = (table: string): HTMLUListElement => {
    const model = initModel(null);
    const json_string = model.get_columns(table);
    let potential_columns: ColumnDataType[] = JSON.parse(json_string);

    const column_list = document.createElement("ul");
    column_list.dataset.total_selected = "0";
    potential_columns.forEach((col) => {
        const column = document.createElement("li");
        column.innerText = `${col.name} (${col.data_type.toLowerCase()})`;
        column.dataset.name = col.name;
        column.dataset.type = col.data_type;
        column.dataset.selected = "false";
        column.dataset.order = "-1";
        column_list.appendChild(column);
    });
    column_list.style.width = "90%";
    column_list.addEventListener("click", (e) => {
        let target = <HTMLLIElement>e.target;
        if (target.dataset.selected == "false") {
            target.classList.add("selected");
            target.dataset.selected = "true";
            column_list.dataset.total_selected = (parseInt(column_list.dataset.total_selected!) + 1).toString();
            target.dataset.order = column_list.dataset.total_selected;
            target.innerText = `${target.dataset.order}. ` + target.innerText;
        } else {
            target.dataset.selected = "false";
            target.classList.remove("selected");
            let removed_number = target.dataset.order!;
            column_list.dataset.total_selected = (parseInt(column_list.dataset.total_selected!) - 1).toString();
            target.innerText = target.innerText.replace(`${target.dataset.order}. `, "");
            target.dataset.order = "-1";
            column_list.querySelectorAll('[data-selected="true"]').forEach((el: Element) => {
                let item = (<HTMLLIElement>el)!;
                let old_order = item.dataset.order!;
                if (old_order >= removed_number) {
                    item.dataset.order = (parseInt(item.dataset.order!) - 1).toString();
                    item.innerText = item.innerText.replace(`${old_order}. `, `${item.dataset.order}. `);
                }
            });
        }
    });

    return column_list;
};

const createRelationshipDiv = (): HTMLDivElement => {
    const side_a = generateTableRelationshipDiv("a");
    const side_b = generateTableRelationshipDiv("b");
    const main_div = document.createElement("div");
    main_div.classList.add("join_container");
    const columns_div = document.createElement("div");
    columns_div.classList.add("columns_container");

    columns_div.appendChild(side_a);
    columns_div.appendChild(side_b);
    main_div.appendChild(columns_div);

    return main_div;
};

const validateAndCreateRelationship = (model: SemanticModelHandle) => {
    const table_a = (<HTMLSelectElement>document.getElementById("table_a"))!.value;
    const table_b = (<HTMLSelectElement>document.getElementById("table_b"))!.value;
    let column_a_len = parseInt((<HTMLUListElement>document.getElementById("columns_a"))!.dataset.total_selected!)!;
    let retrieved_column_a = new Map<number, ColumnDataType>();
    (<HTMLUListElement>document.getElementById("columns_a"))!
        .querySelectorAll("[data-selected=true]")
        .forEach((item) => {
            let column = (<HTMLLIElement>item)!;
            let order = parseInt(column.dataset.order!);
            retrieved_column_a.set(order, {
                name: column.dataset.name!,
                data_type: column.dataset.type!,
            });
        });

    let column_b_len = parseInt((<HTMLUListElement>document.getElementById("columns_b"))!.dataset.total_selected!)!;
    let retrieved_column_b = new Map<number, ColumnDataType>();
    (<HTMLUListElement>document.getElementById("columns_b"))!
        .querySelectorAll("[data-selected=true]")
        .forEach((item) => {
            let column = (<HTMLLIElement>item)!;
            let order = parseInt(column.dataset.order!);
            retrieved_column_b.set(order, {
                name: column.dataset.name!,
                data_type: column.dataset.type!,
            });
        });

    if (column_a_len != column_b_len) {
        throw new Error("Both sides of the relationship must have the same amount of columns");
    }
    if (column_a_len <= 0) {
        throw new Error("You must select atleast 1 column on each side");
    }

    let joins = [];

    for (let i = 1; i <= column_a_len; i++) {
        let a = retrieved_column_a.get(i)!;
        let b = retrieved_column_b.get(i)!;

        if (a.data_type == b.data_type) {
            joins.push([a, b])
        } else {
            throw new Error(
                `Columns must have the same type ${a.name} is of type ${a.data_type}, and ${b.name} is of type ${b.data_type}`,
            );
        }
    }

    model.add_update_relationship(table_a, table_b, JSON.stringify(joins));
};

document.getElementById("import_data_button")?.addEventListener("click", () => {
    document.getElementById("files")?.click();
});

document.getElementById("files")?.addEventListener("change", () => {
    processInputFiles();
});

document.getElementById("log_model")?.addEventListener("click", () => {
    const model = initModel(null);
    const string_model = model.download_model();
    console.log(string_model);
});

document.addEventListener("click", (e: Event) => {
    // Event listener to c any open modal, if mouse click
    // happens outside modal
    const target_element = <HTMLElement>e.target!;
    if (target_element.classList.contains("modal")) {
        target_element.style.display = "none";
    }
});

document.getElementById("open_import")?.addEventListener("click", () => {
    document.getElementById("create_table_modal")!.style.display = "block";
    document.getElementById("progress_bar")!.style.display = "none";
});

document.getElementById("close_table")?.addEventListener("click", () => {
    document.getElementById("create_table_modal")!.style.display = "none";
});

document.getElementById("open_relationship")?.addEventListener("click", () => {
    document.getElementById("create_relationship_modal")!.style.display = "block";
    const rel_div = document.getElementById("relationships");
    rel_div!.innerHTML = "";
    const join_div = createRelationshipDiv();

    rel_div?.appendChild(join_div);
});

document.getElementById("close_relationship")?.addEventListener("click", () => {
    document.getElementById("create_relationship_modal")!.style.display = "none";
});

document.getElementById("close_table_summary")?.addEventListener("click", () => {
    document.getElementById("table_summary_modal")!.style.display = "none";
});

document.getElementById("progress_bar")?.addEventListener("progress_bar_display_update", (e) => {
    document.getElementById("progress_bar")!.style.display = (<CustomEvent>e).detail;
});

document.getElementById("progress_bar")?.addEventListener("table_creation_event", () => {
    let loaded_files: number = Number.parseInt(sessionStorage.getItem("loaded_files")!);
    let total_files: number = Number.parseInt(sessionStorage.getItem("total_files")!);

    (<HTMLProgressElement>document.getElementById("table_creation_bar")!).value = Math.max(
        loaded_files / total_files,
        0.05,
    );
    document.getElementById("table_creation_text")!.innerText = `Created ${loaded_files} of ${total_files} tables...`;
});

document.getElementById("progress_bar")?.addEventListener("table_creation_finished", () => {
    let loaded_files: number = Number.parseInt(sessionStorage.getItem("loaded_files")!);
    let total_files: number = Number.parseInt(sessionStorage.getItem("total_files")!);

    (<HTMLProgressElement>document.getElementById("table_creation_bar")!).value = Math.max(
        loaded_files / total_files,
        0.05,
    );
    document.getElementById("table_creation_text")!.innerText = `Created ${total_files} tables`;

    document.getElementById("create_table_modal")!.style.display = "none";
});

document.getElementById("about_button")?.addEventListener("click", () => {
    document.getElementById("about")!.style.display = "block";
    document.getElementById("datamodel")!.style.display = "none";
});

document.getElementById("datamodel_button")?.addEventListener("click", () => {
    document.getElementById("about")!.style.display = "none";
    document.getElementById("datamodel")!.style.display = "block";
});

document.getElementById("create_rel")?.addEventListener("click", () => {
    const model = initModel(null);
    try {
        validateAndCreateRelationship(model);
    } catch (error) {
        alert(error);
        return;
    }

    createMap(model);

    alert("Relationship added")

    const rel_div = document.getElementById("relationships");
    rel_div!.innerHTML = "";
    const join_div = createRelationshipDiv();
    rel_div?.appendChild(join_div);
});

type ColumnDataType = {
    name: string;
    data_type: string;
};

type Relationship = {
    from_column: {
        table: string,
        column: string,
        description: string
    },
    to_column: {
        table: string,
        column: string,
        description: string
    }
}
