import '../styles/gridjs.css';
import '../styles/style.css';

import { createTablesFromFiles } from './duckdb_wrapper';
import { autodetect_relationships, initModel } from './semantic_layer';

const processInputFiles = async () => {
  const files = (<HTMLInputElement>document.getElementById('files')!).files!;
  await createTablesFromFiles(files);
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

document.getElementById("open_import")?.addEventListener("click", () => {
  document.getElementById("create_table_modal")!.style.display = "block";
})

document.getElementById("close_table")?.addEventListener("click", () => {
  document.getElementById("create_table_modal")!.style.display = "none";
})

document.getElementById("open_relationship")?.addEventListener("click", () => {
  document.getElementById("create_relationship_modal")!.style.display = "block";
})

document.getElementById("close_relationship")?.addEventListener("click", () => {
  document.getElementById("create_relationship_modal")!.style.display = "none";
})


document.getElementById("close_table_summary")?.addEventListener("click", () => {
  document.getElementById("table_summary_modal")!.style.display = "none";
})

document.getElementById("progress_bar")?.addEventListener("progress_bar_display_update", (e) => {
  document.getElementById("progress_bar")!.style.display = (<CustomEvent>e).detail;
})

document.getElementById("progress_bar")?.addEventListener("table_creation_event", () => {
  let loaded_files: number = Number.parseInt(sessionStorage.getItem("loaded_files")!);
  let total_files: number = Number.parseInt(sessionStorage.getItem("total_files")!);

  (<HTMLProgressElement>document.getElementById("table_creation_bar")!).value = Math.max((loaded_files / total_files), 0.05);
  document.getElementById("table_creation_text")!.innerText = `Created ${loaded_files} of ${total_files} tables...`
})

document.getElementById("progress_bar")?.addEventListener("table_creation_finished", () => {
  let loaded_files: number = Number.parseInt(sessionStorage.getItem("loaded_files")!);
  let total_files: number = Number.parseInt(sessionStorage.getItem("total_files")!);

  (<HTMLProgressElement>document.getElementById("table_creation_bar")!).value = Math.max((loaded_files / total_files), 0.05);
  document.getElementById("table_creation_text")!.innerText = `Created ${total_files} tables`;


  document.getElementById("create_table_modal")!.style.display = "none";

})

document.getElementById("auto_rel")?.addEventListener("click", () => {
  const model = initModel(null);
  autodetect_relationships(model);
})