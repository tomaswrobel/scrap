declare module "monaco-editor/esm/vs/editor/editor.worker.js" {
	export function initialize(
		callback: (ctx: worker.IWorkerContext, createData: never) => void,
	): void;
	export function isWorkerInitialized(): boolean;
}
