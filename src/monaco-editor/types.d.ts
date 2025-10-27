declare module "@monaco-editor/worker" {
	export function initialize(
		callback: (ctx: worker.IWorkerContext, createData: never) => void,
	): void;
	export function isWorkerInitialized(): boolean;
}
