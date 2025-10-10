# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: Vite UI in TypeScript. Core logic lives in `src/scripts/` (DuckDB bindings and semantic tools), styles in `src/styles/`, and compiled wasm assets in `public/wasm/`.
- `wasm/`: Rust crate delivering the semantic layer (`semantic_model.rs`, `query_builder.rs`) with exports wired through `lib.rs`; build outputs land in `pkg/` before being synced to the frontend.
- `test_data/`: CSV fixtures for demo scenarios. Keep additions lightweight, documented, and anonymized.

## Build, Test, and Development Commands
- `cd frontend && npm install` installs UI dependencies; rerun after lockfile updates.
- `npm run dev` starts Vite with hot reload; use `npm run preview` for a production-like check.
- `npm run build` runs `tsc` type checks and emits `dist/`.
- `cd wasm && zsh build.zsh` triggers the release pipeline (`cargo build`, `wasm-pack build --target web`, asset copy into `frontend/public/`).
- During Rust iteration, use `cargo build` or `wasm-pack build --target web` directly to avoid copying unchanged bundles.

## Coding Style & Naming Conventions
- TypeScript uses 4-space indentation, `camelCase` for values, and `PascalCase` for exported types. Favor `const`, keep helpers module-scoped, and co-locate styles with components when practical.
- Rust follows `rustfmt` defaults; run `cargo fmt` before opening a PR. Keep modules snake_case and align new files with existing domain splits.

## Testing Guidelines
- Run `cd wasm && wasm-pack test --headless --firefox` to cover the semantic layer; keep suites in `wasm/tests/` and mirror feature names.
- Frontend logic is validated manually today. If you add Vitest or Cypress, document the command alongside `npm run test` references.
- Maintain realistic yet minimal fixtures under `test_data/` and note the scenario each file supports.

## Commit & Pull Request Guidelines
- Commits use short imperative phrases (`added download button`, `productionize`). Keep them scoped, optionally prefixing with context (`wasm: guard empty filters`).
- Pull requests need a summary, test evidence (commands + results), related issue links, and UI screenshots or gifs when visuals change.
- Request review only after `npm run build` and `wasm-pack build --target web` succeed locally, and call out remaining chores.

## WebAssembly Integration Notes
- The UI loads `SemanticModelHandle` from `public/wasm/wasm.js`; adjust `frontend/src/scripts/duckdb_wrapper.ts` if bindings change.
- When upgrading `@duckdb/duckdb-wasm`, regenerate the bundle, confirm browser cache limits, and commit refreshed `public/wasm/` assets.
