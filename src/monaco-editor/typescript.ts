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
 * 
 * Changed:
 * - Transforming TypeScriptWorker.clearFiles to decorator.
 * - Remapping imports, importing tsMode more efficiently.
 */
import {version as tsversion} from 'typescript/package.json'; // do not import the whole typescriptServices here
import type {IEvent, IDisposable} from 'monaco-editor';
import {languages, Emitter} from 'monaco-editor';
import "./tokenizer";

//#region enums copied from typescript to prevent loading the entire typescriptServices ---

export enum ModuleKind {
    None = 0,
    CommonJS = 1,
    AMD = 2,
    UMD = 3,
    System = 4,
    ES2015 = 5,
    ESNext = 99
}

export enum JsxEmit {
    None = 0,
    Preserve = 1,
    React = 2,
    ReactNative = 3,
    ReactJSX = 4,
    ReactJSXDev = 5
}

export enum NewLineKind {
    CarriageReturnLineFeed = 0,
    LineFeed = 1
}

export enum ScriptTarget {
    ES3 = 0,
    ES5 = 1,
    ES2015 = 2,
    ES2016 = 3,
    ES2017 = 4,
    ES2018 = 5,
    ES2019 = 6,
    ES2020 = 7,
    ESNext = 99,
    JSON = 100,
    Latest = ESNext
}

export enum ModuleResolutionKind {
    Classic = 1,
    NodeJs = 2
}
//#endregion

export type LanguageServiceDefaults = languages.typescript.LanguageServiceDefaults;
export type CompilerOptionsValue = languages.typescript.CompilerOptionsValue;
export type DiagnosticsOptions = languages.typescript.DiagnosticsOptions;
export type WorkerOptions = languages.typescript.WorkerOptions;
export type InlayHintsOptions = languages.typescript.InlayHintsOptions;
export type ModeConfiguration = languages.typescript.ModeConfiguration;
export type IExtraLibs = languages.typescript.IExtraLibs;
export type CompilerOptions = languages.typescript.CompilerOptions;
export type Diagnostic = languages.typescript.Diagnostic;
export type DiagnosticRelatedInformation = languages.typescript.DiagnosticRelatedInformation;
export type EmitOutput = languages.typescript.EmitOutput;

export interface ITypeScriptWorker extends languages.typescript.TypeScriptWorker {}

// --- TypeScript configuration and defaults ---------

class LanguageServiceDefaultsImplementation implements LanguageServiceDefaults {
    private _onDidChange = new Emitter<void>();
    private _onDidExtraLibsChange = new Emitter<void>();

    private _extraLibs: IExtraLibs;
    private _removedExtraLibs: {[path: string]: number;};
    private _eagerModelSync: boolean;
    private _compilerOptions!: CompilerOptions;
    private _diagnosticsOptions!: DiagnosticsOptions;
    private _workerOptions!: WorkerOptions;
    private _onDidExtraLibsChangeTimeout: number;
    private _inlayHintsOptions!: InlayHintsOptions;
    private _modeConfiguration!: ModeConfiguration;

    constructor(
        compilerOptions: CompilerOptions,
        diagnosticsOptions: DiagnosticsOptions,
        workerOptions: WorkerOptions,
        inlayHintsOptions: InlayHintsOptions,
        modeConfiguration: ModeConfiguration
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

    get onDidChange(): IEvent<void> {
        return this._onDidChange.event;
    }

    get onDidExtraLibsChange(): IEvent<void> {
        return this._onDidExtraLibsChange.event;
    }

    get modeConfiguration() {
        return this._modeConfiguration;
    }

    get workerOptions() {
        return this._workerOptions;
    }

    get inlayHintsOptions() {
        return this._inlayHintsOptions;
    }

    getExtraLibs() {
        return this._extraLibs;
    }

    addExtraLib(content: string, _filePath?: string): IDisposable {
        let filePath: string;
        if (typeof _filePath === 'undefined') {
            filePath = `ts:extralib-${Math.random().toString(36).substring(2, 15)}`;
        } else {
            filePath = _filePath;
        }

        if (this._extraLibs[filePath] && this._extraLibs[filePath].content === content) {
            // no-op, there already exists an extra lib with this content
            return {
                dispose: () => {}
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
            content: content,
            version: myVersion
        };
        this._fireOnDidExtraLibsChangeSoon();

        return {
            dispose: () => {
                let extraLib = this._extraLibs[filePath];
                if (!extraLib) {
                    return;
                }
                if (extraLib.version !== myVersion) {
                    return;
                }

                delete this._extraLibs[filePath];
                this._removedExtraLibs[filePath] = myVersion;
                this._fireOnDidExtraLibsChangeSoon();
            }
        };
    }

    setExtraLibs(libs: {content: string; filePath?: string;}[]): void {
        for (const filePath in this._extraLibs) {
            this._removedExtraLibs[filePath] = this._extraLibs[filePath].version;
        }
        // clear out everything
        this._extraLibs = Object.create(null);

        if (libs && libs.length > 0) {
            for (const lib of libs) {
                const filePath =
                    lib.filePath || `ts:extralib-${Math.random().toString(36).substring(2, 15)}`;
                const content = lib.content;
                let myVersion = 1;
                if (this._removedExtraLibs[filePath]) {
                    myVersion = this._removedExtraLibs[filePath] + 1;
                }
                this._extraLibs[filePath] = {
                    content: content,
                    version: myVersion
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
            this._onDidExtraLibsChange.fire(undefined);
        }, 0);
    }

    getCompilerOptions() {
        return this._compilerOptions;
    }

    setCompilerOptions(options: CompilerOptions): void {
        this._compilerOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }

    getDiagnosticsOptions() {
        return this._diagnosticsOptions;
    }

    setDiagnosticsOptions(options: DiagnosticsOptions): void {
        this._diagnosticsOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }

    setWorkerOptions(options: WorkerOptions): void {
        this._workerOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }

    setInlayHintsOptions(options: InlayHintsOptions): void {
        this._inlayHintsOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }

    setMaximumWorkerIdleTime() {}

    setEagerModelSync(value: boolean) {
        // doesn't fire an event since no
        // worker restart is required here
        this._eagerModelSync = value;
    }

    getEagerModelSync() {
        return this._eagerModelSync;
    }

    setModeConfiguration(modeConfiguration: ModeConfiguration): void {
        this._modeConfiguration = modeConfiguration || Object.create(null);
        this._onDidChange.fire(undefined);
    }
}

export const typescriptVersion: string = tsversion;

const modeConfigurationDefault: Required<ModeConfiguration> = {
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    definitions: true,
    references: true,
    documentHighlights: true,
    rename: true,
    diagnostics: true,
    documentRangeFormattingEdits: true,
    signatureHelp: true,
    onTypeFormattingEdits: true,
    codeActions: true,
    inlayHints: true
};

export const typescriptDefaults: LanguageServiceDefaults = new LanguageServiceDefaultsImplementation(
    {allowNonTsExtensions: true, target: ScriptTarget.Latest},
    {noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false},
    {},
    {},
    modeConfigurationDefault
);

export const javascriptDefaults: LanguageServiceDefaults = new LanguageServiceDefaultsImplementation(
    {allowNonTsExtensions: true, checkJs: true, allowJs: true, target: ScriptTarget.Latest},
    {noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false},
    {},
    {},
    modeConfigurationDefault
);

export async function getTypeScriptWorker() {
    const mode = await import('./tsMode');
    return mode.getTypeScriptWorker();
}

export async function getJavaScriptWorker() {
    const mode = await import('./tsMode');
    return mode.getTypeScriptWorker();
}

// export to the global based API
languages.typescript = {
    ModuleKind,
    JsxEmit,
    NewLineKind,
    ScriptTarget,
    ModuleResolutionKind,
    typescriptVersion,
    typescriptDefaults,
    javascriptDefaults,
    getTypeScriptWorker,
    getJavaScriptWorker
};

// --- Registration to monaco editor ---
languages.onLanguage('typescript', async () => {
    const mode = await import('./tsMode');
    return mode.setupTypeScript(typescriptDefaults);
});
languages.onLanguage('javascript', async () => {
    const mode = await import('./tsMode');
    return mode.setupJavaScript(javascriptDefaults);
});