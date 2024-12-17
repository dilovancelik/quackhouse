//import '../styles/pico.css';
import '../styles/style.css';

import { createTablesFromFiles } from './duckdb_wrapper';

const processInputFiles = () => {
  const tables = document.getElementById("tables")!;
  const files = (<HTMLInputElement>document.getElementById('files')!).files!;
  createTablesFromFiles(tables, files);
}

document.getElementById("import_data_button")?.addEventListener("click", () => {
  document.getElementById("file")?.click();
});

document.getElementById("file")?.addEventListener("change", () => {
  processInputFiles()
});