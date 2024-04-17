declare var app: import("./app").App;

declare module "*.svg" {
    const url: string;
    export default url;
}

declare module "bundle-text:*" {
    const contents: string;
    export default contents;
}

declare module "monaco-editor/worker" {
    import {worker} from "monaco-editor";

    export interface InitializeCallback<Data = any> {
        (ctx: worker.IWorkerContext, createData: Data): void;
    }

    export function initialize(fn: InitializeCallback): void;
}

declare module "@babel/preset-typescript";