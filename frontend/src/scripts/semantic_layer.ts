import init, { SemanticModelHandle } from '../../public/wasm/wasm';

await init()
let model: SemanticModelHandle | null = null;

const initModel = (name: string | null) => {
    if (model) {
        return model;
    }

    const model_name = name ?? crypto.randomUUID();
    const new_model = new SemanticModelHandle(model_name);
    model = new_model;

    return model;
}


export { initModel }