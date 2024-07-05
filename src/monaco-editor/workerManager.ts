/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT [from-monaco-editor]
 * @author Microsoft Corporation
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Just remapped imports.
 */
import {LanguageServiceDefaults} from './typescript';
import {TypeScriptWorker} from './tsWorker';
import {editor, Uri, IDisposable} from 'monaco-editor';

export class WorkerManager {
    private _configChangeListener: IDisposable;

    private _worker: editor.MonacoWebWorker<TypeScriptWorker> | null;
    private _client: Promise<TypeScriptWorker> | null;

    constructor(
        private readonly _modeId: string,
        private readonly _defaults: LanguageServiceDefaults
    ) {
        this._worker = null;
        this._client = null;
        this._configChangeListener = this._defaults.onDidChange(() => this._stopWorker());
    }

    dispose(): void {
        this._configChangeListener.dispose();
        this._stopWorker();
    }

    private _stopWorker(): void {
        if (this._worker) {
            this._worker.dispose();
            this._worker = null;
        }
        this._client = null;
    }

    private _getClient(): Promise<TypeScriptWorker> {
        if (!this._client) {
            this._client = (async () => {
                this._worker = editor.createWebWorker<TypeScriptWorker>({
                    // module that exports the create() method and returns a `TypeScriptWorker` instance
                    moduleId: 'vs/language/typescript/tsWorker',

                    label: this._modeId,

                    keepIdleModels: true,

                    // passed in to the create() method
                    createData: {
                        compilerOptions: this._defaults.getCompilerOptions(),
                        customWorkerPath: this._defaults.workerOptions.customWorkerPath,
                        inlayHintsOptions: this._defaults.inlayHintsOptions
                    }
                });

                if (this._defaults.getEagerModelSync()) {
                    return await this._worker.withSyncedResources(
                        editor
                            .getModels()
                            .filter((model) => model.getLanguageId() === this._modeId)
                            .map((model) => model.uri)
                    );
                }

                return await this._worker.getProxy();
            })();
        }

        return this._client;
    }

    async getLanguageServiceWorker(...resources: Uri[]): Promise<TypeScriptWorker> {
        const client = await this._getClient();
        if (this._worker) {
            await this._worker.withSyncedResources(resources);
        }
        return client;
    }
}