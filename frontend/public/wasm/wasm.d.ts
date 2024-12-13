/* tslint:disable */
/* eslint-disable */
export function sql_parser_autocomplete(query: string, tables: (string)[], cursor_loc: number): string;
export class Query {
  private constructor();
  free(): void;
}
export class SemanticModelHandle {
  free(): void;
  constructor(name: string);
  add_table(table_name: string, jsoncolumns: string, description?: string): string;
  delete_table(table_name: string): string;
  add_update_relationship(from_table: string, to_table: string, from_columns: (string)[], to_columns: (string)[]): string;
  delete_relationship(from_table: string, to_table: string): string;
  parse_json_query(query: Query): string;
  download_model(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_query_free: (a: number, b: number) => void;
  readonly sql_parser_autocomplete: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly __wbg_semanticmodelhandle_free: (a: number, b: number) => void;
  readonly semanticmodelhandle_new: (a: number, b: number) => number;
  readonly semanticmodelhandle_add_table: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
  readonly semanticmodelhandle_delete_table: (a: number, b: number, c: number) => [number, number, number, number];
  readonly semanticmodelhandle_add_update_relationship: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number, number];
  readonly semanticmodelhandle_delete_relationship: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly semanticmodelhandle_parse_json_query: (a: number, b: number) => [number, number, number, number];
  readonly semanticmodelhandle_download_model: (a: number) => [number, number, number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
