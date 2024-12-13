//import '../styles/pico.css';
import '../styles/style.css';

import { processInputFiles } from './duckdb_wrapper';


document.getElementById("import_data_button")?.addEventListener("click", () => {
  document.getElementById("file")?.click();
});

document.getElementById("file")?.addEventListener("change", () => {
  const tables = document.getElementById("tables")!;
  processInputFiles(tables)
});