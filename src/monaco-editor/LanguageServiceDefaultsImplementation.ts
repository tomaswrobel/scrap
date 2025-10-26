import {Emitter, type IDisposable, type IEvent, type languages} from "monaco-editor";

export class LanguageServiceDefaultsImplementation
	implements languages.typescript.LanguageServiceDefaults
{
	private readonly _onDidChange = new Emitter<void>();
	private readonly _onDidExtraLibsChange = new Emitter<void>();

	private _extraLibs: Partial<languages.typescript.IExtraLibs>;
	private _removedExtraLibs: Record<string, number>;
	private _eagerModelSync: boolean;
	private _compilerOptions!: languages.typescript.CompilerOptions;
	private _diagnosticsOptions!: languages.typescript.DiagnosticsOptions;
	private _workerOptions!: languages.typescript.WorkerOptions;
	private _onDidExtraLibsChangeTimeout: number;
	private _inlayHintsOptions!: languages.typescript.InlayHintsOptions;
	private _modeConfiguration!: languages.typescript.ModeConfiguration;

	constructor(
		compilerOptions: languages.typescript.CompilerOptions,
		diagnosticsOptions: languages.typescript.DiagnosticsOptions,
		workerOptions: languages.typescript.WorkerOptions,
		inlayHintsOptions: languages.typescript.InlayHintsOptions,
		modeConfiguration: languages.typescript.ModeConfiguration,
	) {
		this._extraLibs = Object.create(null);
		this._removedExtraLibs = Object.create(null);
		this._eagerModelSync = false;
		this.setCompilerOptions(compilerOptions);
		this.setDiagnosticsOptions(diagnosticsOptions);
		this.setWorkerOptions(workerOptions);
		this.setInlayHintsOptions(inlayHintsOptions);
		this.setModeConfiguration(modeConfiguration);
		this._onDidExtraLibsChangeTimeout = -1;
	}

	public get onDidChange(): IEvent<void> {
		return this._onDidChange.event;
	}

	public get onDidExtraLibsChange(): IEvent<void> {
		return this._onDidExtraLibsChange.event;
	}

	public get modeConfiguration() {
		return this._modeConfiguration;
	}

	public get workerOptions() {
		return this._workerOptions;
	}

	public get inlayHintsOptions() {
		return this._inlayHintsOptions;
	}

	public getExtraLibs() {
		return this._extraLibs as languages.typescript.IExtraLibs;
	}

	public addExtraLib(
		content: string,
		filePath = `ts:extralib-${Math.random().toString(36).substring(2, 15)}`,
	): IDisposable {
		if (this._extraLibs[filePath]?.content === content) {
			return {
				dispose: () => {
					// no-op, there already exists an extra lib with this content
				},
			};
		}

		let myVersion = 1;
		if (this._removedExtraLibs[filePath]) {
			myVersion = this._removedExtraLibs[filePath] + 1;
		}
		if (this._extraLibs[filePath]) {
			myVersion = this._extraLibs[filePath].version + 1;
		}

		this._extraLibs[filePath] = {
			content,
			version: myVersion,
		};
		this._fireOnDidExtraLibsChangeSoon();

		return {
			dispose: () => {
				const extraLib = this._extraLibs[filePath];
				if (!extraLib) {
					return;
				}
				if (extraLib.version !== myVersion) {
					return;
				}

				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete this._extraLibs[filePath];
				this._removedExtraLibs[filePath] = myVersion;
				this._fireOnDidExtraLibsChangeSoon();
			},
		};
	}

	public setExtraLibs(libs?: {content: string; filePath?: string}[]): void {
		for (const filePath in this._extraLibs) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this._removedExtraLibs[filePath] = this._extraLibs[filePath]!.version;
		}

		// clear out everything
		this._extraLibs = Object.create(null);

		if (libs?.length) {
			for (const lib of libs) {
				const filePath =
					lib.filePath ??
					`ts:extralib-${Math.random().toString(36).substring(2, 15)}`;
				const {content} = lib;
				let myVersion = 1;
				if (this._removedExtraLibs[filePath]) {
					myVersion = this._removedExtraLibs[filePath] + 1;
				}
				this._extraLibs[filePath] = {
					content,
					version: myVersion,
				};
			}
		}

		this._fireOnDidExtraLibsChangeSoon();
	}

	private _fireOnDidExtraLibsChangeSoon(): void {
		if (this._onDidExtraLibsChangeTimeout !== -1) {
			// already scheduled
			return;
		}
		this._onDidExtraLibsChangeTimeout = window.setTimeout(() => {
			this._onDidExtraLibsChangeTimeout = -1;
			this._onDidExtraLibsChange.fire();
		}, 0);
	}

	public getCompilerOptions() {
		return this._compilerOptions;
	}

	public setCompilerOptions(
		options: languages.typescript.CompilerOptions = Object.create(null),
	): void {
		this._compilerOptions = options;
		this._onDidChange.fire();
	}

	public getDiagnosticsOptions() {
		return this._diagnosticsOptions;
	}

	public setDiagnosticsOptions(
		options: languages.typescript.DiagnosticsOptions = Object.create(null),
	): void {
		this._diagnosticsOptions = options;
		this._onDidChange.fire();
	}

	public setWorkerOptions(
		options: languages.typescript.WorkerOptions = Object.create(null),
	): void {
		this._workerOptions = options;
		this._onDidChange.fire();
	}

	public setInlayHintsOptions(
		options: languages.typescript.InlayHintsOptions = Object.create(null),
	): void {
		this._inlayHintsOptions = options;
		this._onDidChange.fire();
	}

	public setMaximumWorkerIdleTime() {
		// empty
	}

	public setEagerModelSync(value: boolean) {
		// doesn't fire an event since no
		// worker restart is required here
		this._eagerModelSync = value;
	}

	public getEagerModelSync() {
		return this._eagerModelSync;
	}

	public setModeConfiguration(
		modeConfiguration: languages.typescript.ModeConfiguration = Object.create(null),
	): void {
		this._modeConfiguration = modeConfiguration;
		this._onDidChange.fire();
	}
}
