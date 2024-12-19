cd wasm
cargo build --release
wasm-pack build --target web --release
cp pkg/* ../frontend/public/*
cd ..