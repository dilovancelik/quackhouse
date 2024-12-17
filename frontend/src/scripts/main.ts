//import '../styles/pico.css';
import '../styles/style.css';

import { createTablesFromFiles } from './duckdb_wrapper';
import { initModel } from './semantic_layer';

const processInputFiles = () => {
  const tables = document.getElementById("tables")!;
  const files = (<HTMLInputElement>document.getElementById('files')!).files!;
  createTablesFromFiles(tables, files);
}

document.getElementById("import_data_button")?.addEventListener("click", () => {
  console.log("click");
  document.getElementById("files")?.click();
});

document.getElementById("files")?.addEventListener("change", () => {
  processInputFiles()
});

document.getElementById("log_model")?.addEventListener("click", () => {
  const model = initModel(null);
  const string_model = model.download_model();
  console.log(string_model);
})