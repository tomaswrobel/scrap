/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT [from-monaco-editor]
 * @copyright Microsoft Corporation 2025
 * @fileoverview Just remapped imports.
 */
import {bind} from "@scrap/utils/bind.ts";
import type {IDisposable, languages, Uri} from "monaco-editor";
import {editor} from "monaco-editor";
import type {Adapter} from "./features/Adapter.js";
import type {TypeScriptWorker} from "./TypeScriptWorker.js";

export class WorkerManager implements IDisposable, Iterable<IDisposable> {
	private disposables: IDisposable[] = [];
	private readonly modeId: string;
	private readonly defaults: languages.typescript.LanguageServiceDefaults;

	private webWorker?: editor.MonacoWebWorker<TypeScriptWorker>;
	private client?: Promise<TypeScriptWorker>;

	constructor(modeId: string, defaults: languages.typescript.LanguageServiceDefaults) {
		this.modeId = modeId;
		this.defaults = defaults;
		this.disposables.push(defaults.onDidChange(this.stopWorker, this));
	}

	public dispose() {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
		this.stopWorker();
	}

	@bind
	public stopWorker() {
		if (this.webWorker) {
			this.webWorker.dispose();
			delete this.webWorker;
		}
		delete this.client;
	}

	*[Symbol.iterator](): Generator<IDisposable> {
		yield* this.disposables;
		yield {dispose: this.stopWorker};
	}

	private getClient() {
		return (this.client ??= (async () => {
			this.webWorker = editor.createWebWorker<TypeScriptWorker>({
				moduleId: new URL("./tsWorker.ts", import.meta.url).href,
				label: this.modeId,

				keepIdleModels: true,

				// passed in to the create() method
				createData: {
					compilerOptions: this.defaults.getCompilerOptions(),
					customWorkerPath: this.defaults.workerOptions.customWorkerPath,
					inlayHintsOptions: this.defaults.inlayHintsOptions,
				},
			});

			if (this.defaults.getEagerModelSync()) {
				return await this.webWorker.withSyncedResources(
					editor
						.getModels()
						.filter(model => model.getLanguageId() === this.modeId)
						.map(model => model.uri),
				);
			}

			return await this.webWorker.getProxy();
		})());
	}

	@bind
	public async worker(...resources: Uri[]) {
		const client = await this.getClient();
		await this.webWorker?.withSyncedResources(resources);
		return client;
	}

	public addAdapter<A extends unknown[], T extends Adapter>(
		adapter: Adapter.Constructor<A, T>,
		...args: A
	) {
		this.disposables.push(new adapter(...args, this.worker).register(this.modeId));
	}
}
