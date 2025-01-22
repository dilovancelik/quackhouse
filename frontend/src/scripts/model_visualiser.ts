import cytoscape from "cytoscape";
import { SemanticModelHandle } from "../../public/wasm/wasm";
import { initDB } from "./duckdb";
import { arrowToHTML } from "./duckdb_wrapper";

const createMap = (model: SemanticModelHandle) => {
    const elements = JSON.parse(model.get_cytoscape_elements());

    let prefers_darkmode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const cy = cytoscape({
        container: document.getElementById("data_model"), // an HTML element you provide in your index.html
        elements: elements,
        style: [
            {
                selector: "node",
                style: {
                    color: "#fff",
                    "background-color": "#f9f9f9",
                    label: "data(id)",
                    "text-valign": "center",
                    "text-halign": "center",
                    shape: "roundrectangle",
                    "text-wrap": "wrap",
                    "border-color": "#646cff",
                    "border-width": 1,
                },
            },
            {
                selector: "edge",
                style: {
                    width: 1,
                    "line-color": "#646cff",
                    "curve-style": "straight",
                },
            },
        ],
        layout: {
            name: "grid",
            fit: true, // Adjusts the graph to fit within the container
        },
        panningEnabled: false,
        zoomingEnabled: false,
    });

    cy.nodes().forEach((node) => {
        const label = node.data("id"); // Node label (or other property)
        const charWidth = 8; // Average width of a character in pixels (adjust as needed)
        const padding = 20; // Extra padding for both sides
        const nodeWidth = label.length * charWidth + padding; // Calculate width
        node.style("width", nodeWidth); // Set the calculated width
    });

    cy.style(prefers_darkmode ? darkmode : lightmode);

    cy.on("tap", "node", (e) => {
        showTable(e);
    });

    cy.on("tap", "edge", (e) => {
        const data: CYEventData = e.target.data();
        let relationship: Relationship[] = JSON.parse(model.get_relationship(data.source, data.target));

        console.log(relationship);
        updateRelationship(relationship);

    });
};

const darkmode: cytoscape.Stylesheet[] = [
    {
        selector: "node",
        style: {
            color: "rgba(255, 255, 255, 0.87)",
            "background-color": "#1a1a1a",
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            shape: "roundrectangle",
            "text-wrap": "wrap",
            "border-color": "#646cff",
            "border-width": 1,
            "padding-top": "10px",
            "padding-bottom": "10px",
            "padding-left": "10px",
            "padding-right": "10px",
        },
    },
    {
        selector: "edge",
        style: {
            width: 1,
            "line-color": "#646cff",
            "curve-style": "straight",
        },
    },
];
const lightmode: cytoscape.Stylesheet[] = [
    {
        selector: "node",
        style: {
            "background-color": "#F8F8F8",
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            shape: "roundrectangle",
            "text-wrap": "wrap",
            "border-color": "#646cff",
            "border-width": 1,
            "padding-top": "10px",
            "padding-bottom": "10px",
            "padding-left": "10px",
            "padding-right": "10px",
        },
    },
    {
        selector: "edge",
        style: {
            width: 1,
            "line-color": "#646cff",
            "curve-style": "straight",
        },
    },
];

const showTable = async (event: cytoscape.EventObject) => {
    const db = await initDB();
    const conn = await db.connect();
    let id = event.target.id();
    let table_modal = document.getElementById("table_summary_modal")!;
    let table = document.getElementById("table_summary")!;
    table.innerHTML = "";
    let result = await conn.query(`SUMMARIZE ${id}`);
    table.appendChild(arrowToHTML(result, id));

    const container = document.querySelector(".gridjs-container")!;
    container.classList.add("dark-mode");
    table_modal.style.display = "block";
};

const updateRelationship = (relationship: Relationship[]) => {
    document.getElementById("open_relationship")!.click();
    console.log(relationship);

    const table_a = (<HTMLSelectElement>document.getElementById("table_a")!);
    const table_b = (<HTMLSelectElement>document.getElementById("table_b")!);

    table_a.value = relationship[0].from_column.table;
    table_a.dispatchEvent(new Event('change'));
    table_b.value = relationship[0].to_column.table;
    table_b.dispatchEvent(new Event('change'));
    table_a.value = relationship[0].from_column.table;

    const columns_a = (<HTMLUListElement>document.getElementById("columns_a")!);
    const columns_b = (<HTMLUListElement>document.getElementById("columns_b")!);
    
    relationship.forEach((rel) => {
        for (var col of columns_a.children) {
            let item = <HTMLLIElement>col;
            if (item.innerText === `${rel.from_column.column} (${rel.from_column.data_type.toLowerCase()})`) {
                item.click();
            }
        }
        for (var col of columns_b.children) {
            let item = <HTMLLIElement>col;
            if (item.innerText === `${rel.to_column.column} (${rel.to_column.data_type.toLowerCase()})`) {
                item.click();
            }
        }
    });
}

type CYEventData = {
    id: string,
    source: string,
    target: string
}

type Relationship = {
    from_column: RelationshipColumn,
    to_column: RelationshipColumn
}

type RelationshipColumn = {
    table: string,
    column: string,
    data_type: string,
    description: string
}

export { createMap };
