import cytoscape from 'cytoscape';
import { SemanticModelHandle } from '../../public/wasm/wasm';
import { initDB } from './duckdb';
import { arrowToHTML } from './duckdb_wrapper';

const createMap = (model: SemanticModelHandle) => {
    const elements = JSON.parse(model.get_cytoscape_elements());

    let prefers_darkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(elements);
    const cy = cytoscape({
        container: document.getElementById('data_model'), // an HTML element you provide in your index.html
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'color': '#fff',
                    'background-color': '#f9f9f9',
                    'label': 'data(id)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'shape': 'roundrectangle',
                    'text-wrap': 'wrap',
                    'border-color': '#646cff',
                    'border-width': 1
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 1,
                    'line-color': '#646cff',
                    'curve-style': 'straight'
                }
            }
        ],
        layout: {
            name: 'grid',
            fit: true // Adjusts the graph to fit within the container
        },
        panningEnabled: false,
        zoomingEnabled: false
    });

    cy.nodes().forEach(node => {
        const label = node.data('id'); // Node label (or other property)
        const charWidth = 8; // Average width of a character in pixels (adjust as needed)
        const padding = 20; // Extra padding for both sides
        const nodeWidth = label.length * charWidth + padding; // Calculate width
        node.style('width', nodeWidth); // Set the calculated width
    });

    cy.style(prefers_darkmode ? darkmode : lightmode);

    cy.on('tap', 'node', (e) => { showTable(e) })

}

const darkmode: cytoscape.Stylesheet[] = [
    {
        selector: 'node',
        style: {
            'color': 'rgba(255, 255, 255, 0.87)',
            'background-color': '#1a1a1a',
            'label': 'data(id)',
            'text-valign': 'center',
            'text-halign': 'center',
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'border-color': '#646cff',
            'border-width': 1,
            'padding-top': '10px',
            'padding-bottom': '10px',
            'padding-left': '10px',
            'padding-right': '10px',
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1,
            'line-color': '#646cff',
            'curve-style': 'straight'
        }
    }
]
const lightmode: cytoscape.Stylesheet[] = [
    {
        selector: 'node',
        style: {
            'background-color': '#F8F8F8',
            'label': 'data(id)',
            'text-valign': 'center',
            'text-halign': 'center',
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'border-color': '#646cff',
            'border-width': 1,
            'padding-top': '10px',
            'padding-bottom': '10px',
            'padding-left': '10px',
            'padding-right': '10px',
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1,
            'line-color': '#646cff',
            'curve-style': 'straight'
        }
    }
]

const showTable = async (event: cytoscape.EventObject) => {
    const db = await initDB();
    const conn = await db.connect()
    let id = event.target.id();
    let table_modal = document.getElementById("table_summary_modal")!;
    let table = document.getElementById("table_summary")!;
    table.innerHTML = "";
    let result = await conn.query(`SUMMARIZE ${id}`);
    table.appendChild(arrowToHTML(result, id));

    const container = document.querySelector('.gridjs-container')!;
    container.classList.add('dark-mode');
    table_modal.style.display = "block";

}

export { createMap }