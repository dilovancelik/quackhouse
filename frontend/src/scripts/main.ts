import "../styles/gridjs.css";
import "../styles/style.css";

import { createTablesFromFiles } from "./duckdb_wrapper";
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
    });
    table_list.dispatchEvent(new Event("change"));

    return div;
};

const get_columns = (table: string): HTMLUListElement => {
    const model = initModel(null);
    const potential_columns: string[] = [];
    model.get_columns(table).forEach((column) => potential_columns.push(column));

    const column_list = document.createElement("ul");
    potential_columns.forEach((col) => {
        const column = document.createElement("li");
        column.innerText = col;
        column.dataset.name = col;
        column.dataset.selected = "false";
        column.dataset.order = "-1";
        column_list.appendChild(column);
    });
    column_list.style.width = "90%";

    return column_list;
};

const createRelationshipDiv = (): HTMLDivElement => {
    const side_a = generateTableRelationshipDiv();
    const side_b = generateTableRelationshipDiv();
    const close = document.createElement("span");
    close.innerHTML = "&times;";
    close.classList.add("close");
    const main_div = document.createElement("div");
    main_div.classList.add("join_container");
    main_div.appendChild(close);
    const columns_div = document.createElement("div");
    columns_div.classList.add("columns_container");

    columns_div.appendChild(side_a);
    columns_div.appendChild(side_b);
    main_div.appendChild(columns_div);

    close.addEventListener("click", () => {
        main_div.remove();
    });
    return main_div;
};

document.getElementById("import_data_button")?.addEventListener("click", () => {
    console.log("click");
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
    // Event listener to close any open modal, if mouse click
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
});
