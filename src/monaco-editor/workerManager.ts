/**
 * This file is a part of Scrap Native, an app for helping to migrate
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
import type {LanguageServiceDefaults} from "./typescript";
import type {TypeScriptWorker} from "./tsWorker";
import type {Uri, IDisposable} from "monaco-editor";
import {editor} from "monaco-editor";

export class WorkerManager {
	private configChangeListener: IDisposable;

	private worker?: editor.MonacoWebWorker<TypeScriptWorker>;
	private client?: Promise<TypeScriptWorker>;

	constructor(private readonly modeId: string, private readonly defaults: LanguageServiceDefaults) {
		this.configChangeListener = defaults.onDidChange(() => this.stopWorker());
	}

	public dispose() {
		this.configChangeListener.dispose();
		this.stopWorker();
	}

	private stopWorker() {
		if (this.worker) {
			this.worker.dispose();
			delete this.worker;
		}
		delete this.client;
	}

	private getClient(): Promise<TypeScriptWorker> {
		if (!this.client) {
			this.client = (async () => {
				this.worker = editor.createWebWorker<TypeScriptWorker>({
					// module that exports the create() method and returns a `TypeScriptWorker` instance
					moduleId: "vs/language/typescript/tsWorker",

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
					return await this.worker.withSyncedResources(
						editor
							.getModels()
							.filter(model => model.getLanguageId() === this.modeId)
							.map(model => model.uri)
					);
				}

				return await this.worker.getProxy();
			})();
		}

		return this.client;
	}

	public async getLanguageServiceWorker(...resources: Uri[]): Promise<TypeScriptWorker> {
		const client = await this.getClient();
		if (this.worker) {
			await this.worker.withSyncedResources(resources);
		}
		return client;
	}
}
