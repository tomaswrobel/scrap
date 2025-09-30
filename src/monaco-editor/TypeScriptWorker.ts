/* eslint-disable @typescript-eslint/require-await */
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
 *
 * Added:
 * - Scrap lib instead of TypeScript lib.
 * - Error diagnostics for advanced syntax.
 *
 * Changed:
 * - Transforming TypeScriptWorker.clearFiles to decorator.
 * - Remapping imports.
 */
import defaultLib from "@scrap/typings/static/index.d.ts?raw";
import type {Uri, languages, worker} from "monaco-editor";
import ts from "typescript";

/**
 * Loading a default lib as a source file will mess up TS completely.
 * So our strategy is to hide such a text model from TS.
 * See https://github.com/microsoft/monaco-editor/issues/2182
 */
function fileNameIsLib(resource: Uri | string): boolean {
	if (typeof resource === "string") {
		return resource === "file:///lib.d.ts";
	}
	return resource.path === "/lib.d.ts";
}

/**
 * A decorator that adds Scrap related diagnostics.
 * Add this to either a semantic or syntactic diagnostic method.
 *
 * @param target A TypeScriptWorker instance
 * @param key A string
 * @param value A TypedPropertyDescriptor
 */
function withScrapDiagnostics<T extends TypeScriptWorker>(
	this: void,
	value: (this: T, fileName: string) => Promise<languages.typescript.Diagnostic[]>,
	_context: ClassMethodDecoratorContext<T, typeof value>,
): typeof value {
	return async function (fileName: string) {
		const diagnostics = await value.call(this, fileName);
		const program = this.languageService.getProgram();

		if (!program) {
			return diagnostics;
		}

		const sourceFile = program.getSourceFile(fileName);
		if (!sourceFile) {
			return diagnostics;
		}

		sourceFile.forEachChild(function visit(node) {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
			switch (node.kind) {
				case ts.SyntaxKind.ClassDeclaration:
				case ts.SyntaxKind.ClassExpression:
					diagnostics.push({
						messageText: "Classes are not allowed",
						category: ts.DiagnosticCategory.Error,
						code: 9999,
						start: node.getStart(),
						length: node.getWidth(),
						file: {fileName},
					});
					break;
				case ts.SyntaxKind.FunctionDeclaration:
				case ts.SyntaxKind.FunctionExpression: {
					const fn = node as ts.FunctionDeclaration | ts.FunctionExpression;
					if (fn.asteriskToken) {
						diagnostics.push({
							messageText: "Generators not allowed.",
							category: ts.DiagnosticCategory.Error,
							code: 9999,
							start: node.getStart(),
							length: node.getWidth(),
							file: {fileName},
						});
					}
					break;
				}
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
						file: {fileName},
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
							file: {fileName},
						},
						{
							messageText:
								"Scrap does not use TypeScript type-checking. It uses its own, much simpler type system because the translation to blocks",
							category: ts.DiagnosticCategory.Message,
							code: 9999,
							start: node.getStart(),
							length: node.getWidth(),
							file: {fileName},
						},
					);
					break;
				case ts.SyntaxKind.InterfaceDeclaration: {
					const interfaceNode = node as ts.InterfaceDeclaration;
					if (interfaceNode.name.text === "Variables") {
						if (interfaceNode.heritageClauses?.length) {
							diagnostics.push({
								messageText:
									"Variables interface cannot extend other interfaces",
								category: ts.DiagnosticCategory.Error,
								code: 9999,
								start: node.getStart(),
								length: node.getWidth(),
								file: {fileName},
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
						file: {fileName},
					});
					break;
				}
				case ts.SyntaxKind.EnumDeclaration:
					diagnostics.push({
						messageText: "Enums are not allowed",
						category: ts.DiagnosticCategory.Error,
						code: 9999,
						start: node.getStart(),
						length: node.getWidth(),
						file: {fileName},
					});
					break;
				case ts.SyntaxKind.ModuleDeclaration:
					diagnostics.push({
						messageText: "Namespaces are not allowed",
						category: ts.DiagnosticCategory.Error,
						code: 9999,
						start: node.getStart(),
						length: node.getWidth(),
						file: {fileName},
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
						file: {fileName},
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
							file: {fileName},
						},
						{
							messageText:
								"Scrap does not use TypeScript type-checking. It uses its own, much simpler type system because the translation to blocks",
							category: ts.DiagnosticCategory.Message,
							code: 9999,
							start: node.getStart(),
							length: node.getWidth(),
							file: {fileName},
						},
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
						file: {fileName},
					});
					break;
				case ts.SyntaxKind.ThisKeyword:
					diagnostics.push({
						messageText: "This won't have a value in Scrap. Use `self` instead.",
						category: ts.DiagnosticCategory.Error,
						code: 9999,
						start: node.getStart(),
						length: node.getWidth(),
						file: {fileName},
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
							file: {fileName},
						},
						{
							messageText:
								"In fact, Scrap transforms every call to an awaited one and every function to an async one.",
							category: ts.DiagnosticCategory.Message,
							code: 9999,
							start: node.getStart(),
							length: node.getWidth(),
							file: {fileName},
						},
					);
					break;
				default:
					break;
			}

			ts.forEachChild(node, visit);
		});

		return diagnostics;
	};
}

function clearFiles<T extends TypeScriptWorker>(
	this: void,
	value: (this: T, fileName: string) => Promise<languages.typescript.Diagnostic[]>,
	_context: ClassMethodDecoratorContext<T, typeof value>,
): typeof value {
	return async function (fileName) {
		const diagnostics = await value.call(this, fileName);

		if (diagnostics.length === 0) {
			return diagnostics;
		}

		return diagnostics.reduce<languages.typescript.Diagnostic[]>((acc, diag) => {
			return [
				...acc,
				{
					...diag,
					file: diag.file && {fileName: diag.file.fileName},
					relatedInformation: diag.relatedInformation?.map(ri => ({
						...ri,
						file: ri.file && {fileName: ri.file.fileName},
					})),
				},
			];
		}, []);
	};
}

export class TypeScriptWorker
	implements ts.LanguageServiceHost, languages.typescript.TypeScriptWorker
{
	// --- model sync -----------------------

	public readonly languageService = ts.createLanguageService(this);
	private readonly ctx: worker.IWorkerContext;
	private readonly createData: TypeScriptWorker.CreateData;

	constructor(ctx: worker.IWorkerContext, createData: TypeScriptWorker.CreateData) {
		this.ctx = ctx;
		this.createData = createData;
	}

	// --- language service host ---------------

	public getCompilationSettings(): ts.CompilerOptions {
		return this.createData.compilerOptions;
	}

	public getLanguageService(): ts.LanguageService {
		return this.languageService;
	}

	public getExtraLibs(): languages.typescript.IExtraLibs {
		return {};
	}

	public getScriptFileNames(): string[] {
		const allModels = this.ctx.getMirrorModels().map(model => model.uri);
		return allModels.filter(uri => !fileNameIsLib(uri)).map(String);
	}

	private getModel(fileName: string): worker.IMirrorModel | null {
		for (const model of this.ctx.getMirrorModels()) {
			if (model.uri.toString() === fileName || model.uri.toString(true) === fileName) {
				return model;
			}
		}
		return null;
	}

	public getScriptVersion(fileName: string): string {
		const model = this.getModel(fileName);
		if (model) {
			return model.version.toString();
		} else if (this.isDefaultLibFileName(fileName)) {
			// default lib is static
			return "1";
		}
		return "";
	}

	public async getScriptText(fileName: string): Promise<string | undefined> {
		return this.getScriptTextSync(fileName);
	}

	private getScriptTextSync(fileName: string): string | undefined {
		const model = this.getModel(fileName);
		if (model) {
			// a true editor model
			return model.getValue();
		} else if (fileName === "lib.d.ts") {
			// default lib
			return defaultLib;
		} else {
		}
	}

	public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
		const text = this.getScriptTextSync(fileName);

		if (text === undefined) {
			return;
		}

		return {
			getText: (start, end) => text.substring(start, end),
			getLength: () => text.length,
			getChangeRange: () => undefined,
		};
	}

	public getDefaultLibFileName() {
		return "lib.d.ts";
	}

	public getScriptKind?(fileName: string): ts.ScriptKind {
		const suffix = fileName.substring(fileName.lastIndexOf(".") + 1);
		switch (suffix) {
			case "ts":
				return ts.ScriptKind.TS;
			case "tsx":
				return ts.ScriptKind.TSX;
			case "js":
				return ts.ScriptKind.JS;
			case "jsx":
				return ts.ScriptKind.JSX;
			default:
				return this.getCompilationSettings().allowJs
					? ts.ScriptKind.JS
					: ts.ScriptKind.TS;
		}
	}

	public getCurrentDirectory(): string {
		return "";
	}

	public isDefaultLibFileName(fileName: string): boolean {
		return fileName === "lib.d.ts";
	}

	public readFile(path: string): string | undefined {
		return this.getScriptTextSync(path);
	}

	public fileExists(path: string): boolean {
		return this.getScriptTextSync(path) !== undefined;
	}

	public async getLibFiles(): Promise<Record<string, string>> {
		return {"lib.d.ts": defaultLib};
	}

	// --- language features

	@clearFiles
	public async getSyntacticDiagnostics(
		fileName: string,
	): Promise<languages.typescript.Diagnostic[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getSyntacticDiagnostics(fileName);
	}

	@withScrapDiagnostics
	@clearFiles
	public async getSemanticDiagnostics(
		fileName: string,
	): Promise<languages.typescript.Diagnostic[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getSemanticDiagnostics(fileName);
	}

	@clearFiles
	public async getSuggestionDiagnostics(
		fileName: string,
	): Promise<languages.typescript.Diagnostic[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getSuggestionDiagnostics(fileName);
	}

	@clearFiles
	public async getCompilerOptionsDiagnostics(
		fileName: string,
	): Promise<languages.typescript.Diagnostic[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getCompilerOptionsDiagnostics();
	}

	public async getCompletionsAtPosition(
		fileName: string,
		position: number,
	): Promise<ts.CompletionInfo | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getCompletionsAtPosition(fileName, position, undefined);
	}

	public async getCompletionEntryDetails(
		fileName: string,
		position: number,
		entry: string,
	): Promise<ts.CompletionEntryDetails | undefined> {
		return this.languageService.getCompletionEntryDetails(
			fileName,
			position,
			entry,
			undefined,
			undefined,
			undefined,
			undefined,
		);
	}

	public async getSignatureHelpItems(
		fileName: string,
		position: number,
		options: ts.SignatureHelpItemsOptions | undefined,
	): Promise<ts.SignatureHelpItems | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getSignatureHelpItems(fileName, position, options);
	}

	public async getQuickInfoAtPosition(
		fileName: string,
		position: number,
	): Promise<ts.QuickInfo | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getQuickInfoAtPosition(fileName, position);
	}

	public async getDocumentHighlights(
		fileName: string,
		position: number,
		filesToSearch: string[],
	): Promise<readonly ts.DocumentHighlights[] | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getDocumentHighlights(fileName, position, filesToSearch);
	}

	public async getDefinitionAtPosition(
		fileName: string,
		position: number,
	): Promise<readonly ts.DefinitionInfo[] | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getDefinitionAtPosition(fileName, position);
	}

	public async getReferencesAtPosition(
		fileName: string,
		position: number,
	): Promise<ts.ReferenceEntry[] | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getReferencesAtPosition(fileName, position);
	}

	public async getNavigationTree(fileName: string): Promise<ts.NavigationTree | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.getNavigationTree(fileName);
	}

	public async getFormattingEditsForDocument(
		fileName: string,
		options: ts.FormatCodeSettings,
	): Promise<ts.TextChange[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getFormattingEditsForDocument(fileName, options);
	}

	public async getFormattingEditsForRange(
		fileName: string,
		start: number,
		end: number,
		options: ts.FormatCodeSettings,
	): Promise<ts.TextChange[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getFormattingEditsForRange(fileName, start, end, options);
	}

	public async getFormattingEditsAfterKeystroke(
		fileName: string,
		postion: number,
		ch: string,
		options: ts.FormatCodeSettings,
	): Promise<ts.TextChange[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		return this.languageService.getFormattingEditsAfterKeystroke(
			fileName,
			postion,
			ch,
			options,
		);
	}

	public async findRenameLocations(
		fileName: string,
		position: number,
		findInStrings: boolean,
		findInComments: boolean,
		providePrefixAndSuffixTextForRename: boolean,
	): Promise<readonly ts.RenameLocation[] | undefined> {
		if (fileNameIsLib(fileName)) {
			return undefined;
		}
		return this.languageService.findRenameLocations(
			fileName,
			position,
			findInStrings,
			findInComments,
			{providePrefixAndSuffixTextForRename, excludeLibrarySymbolsInNavTo: true},
		);
	}

	public async getRenameInfo(
		fileName: string,
		position: number,
		options: ts.UserPreferences,
	): Promise<ts.RenameInfo> {
		if (fileNameIsLib(fileName)) {
			return {
				canRename: false,
				localizedErrorMessage: "Cannot rename in lib file",
			};
		}
		return this.languageService.getRenameInfo(fileName, position, options);
	}

	public async getEmitOutput(fileName: string) {
		if (fileNameIsLib(fileName)) {
			return {
				outputFiles: [],
				emitSkipped: true,
				diagnostics: [],
			};
		}

		return this.languageService.getEmitOutput(fileName) as languages.typescript.EmitOutput;
	}

	public async getCodeFixesAtPosition(
		fileName: string,
		start: number,
		end: number,
		errorCodes: number[],
		formatOptions: ts.FormatCodeSettings,
	): Promise<readonly ts.CodeFixAction[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}
		const preferences = {};
		try {
			return this.languageService.getCodeFixesAtPosition(
				fileName,
				start,
				end,
				errorCodes,
				formatOptions,
				preferences,
			);
		} catch {
			return [];
		}
	}

	public async updateExtraLibs() {
		// No extra libs
	}

	public async provideInlayHints(
		fileName: string,
		start: number,
		end: number,
	): Promise<readonly ts.InlayHint[]> {
		if (fileNameIsLib(fileName)) {
			return [];
		}

		try {
			return this.languageService.provideInlayHints(
				fileName,
				{
					start,
					length: end - start,
				},
				this.createData.inlayHintsOptions ?? {},
			);
		} catch {
			return [];
		}
	}
}

export declare namespace TypeScriptWorker {
	interface CreateData {
		compilerOptions: ts.CompilerOptions;
		extraLibs: languages.typescript.IExtraLibs;
		customWorkerPath?: string;
		inlayHintsOptions?: ts.UserPreferences;
	}
}
