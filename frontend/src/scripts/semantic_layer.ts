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

const autodetect_relationships = (model: SemanticModelHandle) => {
    let potential_relationships = JSON.parse(model.auto_detect_relationships());
    console.log(potential_relationships);
}

export { initModel, autodetect_relationships }