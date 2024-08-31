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
 * Added:
 * - Scrap lib instead of TypeScript lib.
 * - Error diagnostics for advanced syntax.
 * 
 * Changed:
 * - Transforming TypeScriptWorker.clearFiles to decorator.
 * - Remapping imports.
 */
import ts from 'typescript';
import type {Diagnostic, IExtraLibs, ITypeScriptWorker} from './typescript';
import type {Uri, languages, worker} from 'monaco-editor';

import path from 'path';
import fs from 'fs';

const DEFAULT_LIB = fs.readFileSync(path.join(__dirname, "lib", "static.d.ts"), "utf-8");

/**
 * Loading a default lib as a source file will mess up TS completely.
 * So our strategy is to hide such a text model from TS.
 * See https://github.com/microsoft/monaco-editor/issues/2182
 */
function fileNameIsLib(resource: Uri | string): boolean {
    if (typeof resource === 'string') {
        return resource === "file:///lib.d.ts";
    }
    return resource.path === "/lib.d.ts";
}

export class TypeScriptWorker implements ts.LanguageServiceHost, ITypeScriptWorker {
    // --- model sync -----------------------

    private _ctx: worker.IWorkerContext;
    private _languageService = ts.createLanguageService(this);
    private _compilerOptions: ts.CompilerOptions;
    private _inlayHintsOptions?: ts.UserPreferences;

    constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
        this._ctx = ctx;
        this._compilerOptions = createData.compilerOptions;
        this._inlayHintsOptions = createData.inlayHintsOptions;
    }

    // --- language service host ---------------

    getCompilationSettings(): ts.CompilerOptions {
        return this._compilerOptions;
    }

    getLanguageService(): ts.LanguageService {
        return this._languageService;
    }

    getExtraLibs(): IExtraLibs {
        return {};
    }

    getScriptFileNames(): string[] {
        const allModels = this._ctx.getMirrorModels().map((model) => model.uri);
        return allModels.filter((uri) => !fileNameIsLib(uri)).map((uri) => uri.toString());
    }

    private _getModel(fileName: string): worker.IMirrorModel | null {
        let models = this._ctx.getMirrorModels();
        for (let i = 0; i < models.length; i++) {
            const uri = models[i].uri;
            if (uri.toString() === fileName || uri.toString(true) === fileName) {
                return models[i];
            }
        }
        return null;
    }

    getScriptVersion(fileName: string): string {
        let model = this._getModel(fileName);
        if (model) {
            return model.version.toString();
        } else if (this.isDefaultLibFileName(fileName)) {
            // default lib is static
            return '1';
        }
        return '';
    }

    async getScriptText(fileName: string): Promise<string | undefined> {
        return this._getScriptText(fileName);
    }

    _getScriptText(fileName: string): string | undefined {
        let text: string;
        let model = this._getModel(fileName);
        if (model) {
            // a true editor model
            text = model.getValue();
        } else if (fileName === "lib.d.ts") {
            // default lib
            text = DEFAULT_LIB;
        } else {
            return;
        }

        return text;
    }

    getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
        const text = this._getScriptText(fileName);
        if (text === undefined) {
            return;
        }

        return <ts.IScriptSnapshot>{
            getText: (start, end) => text.substring(start, end),
            getLength: () => text.length,
            getChangeRange: () => undefined
        };
    }

    getDefaultLibFileName() {
        return "lib.d.ts";
    }

    getScriptKind?(fileName: string): ts.ScriptKind {
        const suffix = fileName.substring(fileName.lastIndexOf('.') + 1);
        switch (suffix) {
            case 'ts':
                return ts.ScriptKind.TS;
            case 'tsx':
                return ts.ScriptKind.TSX;
            case 'js':
                return ts.ScriptKind.JS;
            case 'jsx':
                return ts.ScriptKind.JSX;
            default:
                return this.getCompilationSettings().allowJs ? ts.ScriptKind.JS : ts.ScriptKind.TS;
        }
    }

    getCurrentDirectory(): string {
        return '';
    }

    isDefaultLibFileName(fileName: string): boolean {
        return fileName === "lib.d.ts";
    }

    readFile(path: string): string | undefined {
        return this._getScriptText(path);
    }

    fileExists(path: string): boolean {
        return this._getScriptText(path) !== undefined;
    }

    async getLibFiles(): Promise<Record<string, string>> {
        return {"lib.d.ts": DEFAULT_LIB};
    }

    // --- language features

    public static clearFiles<T extends TypeScriptWorker>(_target: T, _key: string, value: TypedPropertyDescriptor<(this: T, fileName: string) => Promise<Diagnostic[]>>): typeof value {
        return {
            configurable: true,
            enumerable: false,
            async value(fileName: string) {
                const diagnostics = await value.value!.call(this, fileName);

                if (diagnostics.length === 0) {
                    return diagnostics;
                }

                return diagnostics.reduce(
                    (acc, diag) => {
                        return [
                            ...acc,
                            {
                                ...diag,
                                file: diag.file && {fileName: diag.file.fileName},
                                relatedInformation: diag.relatedInformation?.map((ri) => ({
                                    ...ri,
                                    file: ri.file && {fileName: ri.file.fileName}
                                }))
                            }
                        ];
                    },
                    [] as Diagnostic[]
                );
            }
        };
    }

    /**
     * A decorator that adds Scrap related diagnostics.
     * Add this to either a semantic or syntactic diagnostic method.
     * 
     * @param _target A TypeScriptWorker instance
     * @param _key A string
     * @param value A TypedPropertyDescriptor
     */
    public static scrap<T extends TypeScriptWorker>(_target: T, _key: string, value: TypedPropertyDescriptor<(this: T, fileName: string) => Promise<Diagnostic[]>>): typeof value {
        return {
            configurable: true,
            enumerable: false,
            async value(fileName: string) {
                const diagnostics = await value.value!.call(this, fileName);
                const program = this._languageService.getProgram();

                if (!program) {
                    return diagnostics;
                }

                const sourceFile = program.getSourceFile(fileName);
                if (!sourceFile) {
                    return diagnostics;
                }

                sourceFile.forEachChild(function visit(node) {
                    switch (node.kind) {
                        case ts.SyntaxKind.ClassDeclaration:
                        case ts.SyntaxKind.ClassExpression:
                            diagnostics.push({
                                messageText: "Classes are not allowed",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.ExportDeclaration:
                        case ts.SyntaxKind.ExportAssignment:
                        case ts.SyntaxKind.ImportDeclaration:
                        case ts.SyntaxKind.ImportEqualsDeclaration:
                            diagnostics.push({
                                messageText: "You are not inside a module!",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.TypeAliasDeclaration:
                            diagnostics.push(
                                {
                                    messageText: "Type aliases are not allowed",
                                    category: ts.DiagnosticCategory.Error,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                },
                                {
                                    messageText: "Scrap does not use TypeScript type-checking. It uses its own, much simpler type system because the translation to blocks",
                                    category: ts.DiagnosticCategory.Message,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                }
                            );
                            break;
                        case ts.SyntaxKind.InterfaceDeclaration:
                            const interfaceNode = node as ts.InterfaceDeclaration;
                            if (interfaceNode.name.text === "Variables") {
                                if (interfaceNode.heritageClauses?.length) {
                                    diagnostics.push({
                                        messageText: "Variables interface cannot extend other interfaces",
                                        category: ts.DiagnosticCategory.Error,
                                        code: 9999,
                                        start: node.getStart(),
                                        length: node.getWidth(),
                                        file: {fileName}
                                    });
                                }
                                break;
                            }
                            diagnostics.push({
                                messageText: "Interfaces are not allowed",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.EnumDeclaration:
                            diagnostics.push({
                                messageText: "Enums are not allowed",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.ModuleDeclaration:
                            diagnostics.push({
                                messageText: "Namespaces are not allowed",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.LiteralType:
                        case ts.SyntaxKind.TupleType:
                            diagnostics.push({
                                messageText: "Literal types are not allowed",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.AsExpression:
                        case ts.SyntaxKind.SatisfiesExpression:
                            diagnostics.push(
                                {
                                    messageText: "Type assertions are not allowed",
                                    category: ts.DiagnosticCategory.Error,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                },
                                {
                                    messageText: "Scrap does not use TypeScript type-checking. It uses its own, much simpler type system because the translation to blocks",
                                    category: ts.DiagnosticCategory.Message,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                }
                            );
                            break;
                        case ts.SyntaxKind.NullKeyword:
                        case ts.SyntaxKind.UndefinedKeyword:
                            diagnostics.push({
                                messageText: "In Scrap, there is no null or undefined",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.ThisKeyword:
                            diagnostics.push({
                                messageText: "This won't have a value in Scrap. Use `self` instead.",
                                category: ts.DiagnosticCategory.Error,
                                code: 9999,
                                start: node.getStart(),
                                length: node.getWidth(),
                                file: {fileName}
                            });
                            break;
                        case ts.SyntaxKind.AwaitExpression:
                        case ts.SyntaxKind.AsyncKeyword:
                            diagnostics.push(
                                {
                                    messageText: "Async / await is redundant in Scrap",
                                    category: ts.DiagnosticCategory.Error,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                },
                                {
                                    messageText: "In fact, Scrap transforms every call to an awaited one and every function to an async one.",
                                    category: ts.DiagnosticCategory.Message,
                                    code: 9999,
                                    start: node.getStart(),
                                    length: node.getWidth(),
                                    file: {fileName}
                                }
                            );
                            break;
                    }

                    ts.forEachChild(node, visit);
                });

                return diagnostics;
            }
        };
    }

    @TypeScriptWorker.clearFiles
    async getSyntacticDiagnostics(fileName: string): Promise<Diagnostic[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getSyntacticDiagnostics(fileName);
    }

    @TypeScriptWorker.scrap
    @TypeScriptWorker.clearFiles
    async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getSemanticDiagnostics(fileName);
    }

    @TypeScriptWorker.clearFiles
    async getSuggestionDiagnostics(fileName: string): Promise<Diagnostic[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getSuggestionDiagnostics(fileName);
    }

    @TypeScriptWorker.clearFiles
    async getCompilerOptionsDiagnostics(fileName: string): Promise<Diagnostic[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getCompilerOptionsDiagnostics();
    }

    async getCompletionsAtPosition(
        fileName: string,
        position: number
    ): Promise<ts.CompletionInfo | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getCompletionsAtPosition(fileName, position, undefined);
    }

    async getCompletionEntryDetails(
        fileName: string,
        position: number,
        entry: string
    ): Promise<ts.CompletionEntryDetails | undefined> {
        return this._languageService.getCompletionEntryDetails(
            fileName,
            position,
            entry,
            undefined,
            undefined,
            undefined,
            undefined
        );
    }

    async getSignatureHelpItems(
        fileName: string,
        position: number,
        options: ts.SignatureHelpItemsOptions | undefined
    ): Promise<ts.SignatureHelpItems | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getSignatureHelpItems(fileName, position, options);
    }

    async getQuickInfoAtPosition(
        fileName: string,
        position: number
    ): Promise<ts.QuickInfo | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getQuickInfoAtPosition(fileName, position);
    }

    async getDocumentHighlights(
        fileName: string,
        position: number,
        filesToSearch: string[]
    ): Promise<ReadonlyArray<ts.DocumentHighlights> | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getDocumentHighlights(fileName, position, filesToSearch);
    }

    async getDefinitionAtPosition(
        fileName: string,
        position: number
    ): Promise<ReadonlyArray<ts.DefinitionInfo> | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getDefinitionAtPosition(fileName, position);
    }

    async getReferencesAtPosition(
        fileName: string,
        position: number
    ): Promise<ts.ReferenceEntry[] | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getReferencesAtPosition(fileName, position);
    }

    async getNavigationTree(fileName: string): Promise<ts.NavigationTree | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getNavigationTree(fileName);
    }

    async getFormattingEditsForDocument(
        fileName: string,
        options: ts.FormatCodeOptions
    ): Promise<ts.TextChange[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsForDocument(fileName, options);
    }

    async getFormattingEditsForRange(
        fileName: string,
        start: number,
        end: number,
        options: ts.FormatCodeOptions
    ): Promise<ts.TextChange[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsForRange(fileName, start, end, options);
    }

    async getFormattingEditsAfterKeystroke(
        fileName: string,
        postion: number,
        ch: string,
        options: ts.FormatCodeOptions
    ): Promise<ts.TextChange[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options);
    }

    async findRenameLocations(
        fileName: string,
        position: number,
        findInStrings: boolean,
        findInComments: boolean,
        providePrefixAndSuffixTextForRename: boolean
    ): Promise<readonly ts.RenameLocation[] | undefined> {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.findRenameLocations(
            fileName,
            position,
            findInStrings,
            findInComments,
            providePrefixAndSuffixTextForRename
        );
    }

    async getRenameInfo(
        fileName: string,
        position: number,
        options: ts.UserPreferences
    ): Promise<ts.RenameInfo> {
        if (fileNameIsLib(fileName)) {
            return {canRename: false, localizedErrorMessage: 'Cannot rename in lib file'};
        }
        return this._languageService.getRenameInfo(fileName, position, options);
    }

    async getEmitOutput(fileName: string) {
        if (fileNameIsLib(fileName)) {
            return {
                outputFiles: [],
                emitSkipped: true,
                diagnostics: []
            };
        }

        return this._languageService.getEmitOutput(fileName) as languages.typescript.EmitOutput;
    }

    async getCodeFixesAtPosition(
        fileName: string,
        start: number,
        end: number,
        errorCodes: number[],
        formatOptions: ts.FormatCodeSettings
    ): Promise<ReadonlyArray<ts.CodeFixAction>> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const preferences = {};
        try {
            return this._languageService.getCodeFixesAtPosition(
                fileName,
                start,
                end,
                errorCodes,
                formatOptions,
                preferences
            );
        } catch {
            return [];
        }
    }

    async updateExtraLibs(_extraLibs: IExtraLibs) {}

    async provideInlayHints(
        fileName: string,
        start: number,
        end: number
    ): Promise<readonly ts.InlayHint[]> {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const preferences: ts.UserPreferences = this._inlayHintsOptions ?? {};
        const span: ts.TextSpan = {
            start,
            length: end - start
        };

        try {
            return this._languageService.provideInlayHints(fileName, span, preferences);
        } catch {
            return [];
        }
    }
}

export interface ICreateData {
    compilerOptions: ts.CompilerOptions;
    extraLibs: IExtraLibs;
    customWorkerPath?: string;
    inlayHintsOptions?: ts.UserPreferences;
}

/** The shape of the factory */
export interface CustomTSWebWorkerFactory {
    (
        TSWorkerClass: typeof TypeScriptWorker,
        tsc: typeof ts,
        libs: Record<string, string>
    ): typeof TypeScriptWorker;
}

export function create(ctx: worker.IWorkerContext, createData: ICreateData) {
    return new TypeScriptWorker(ctx, createData);
}
