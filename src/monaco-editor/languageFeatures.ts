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
import type {Diagnostic, DiagnosticRelatedInformation, LanguageServiceDefaults} from "./typescript";
import type ts from "typescript";
import type {TypeScriptWorker} from "./tsWorker";
import type {Position, CancellationToken, IDisposable, IRange} from "monaco-editor";
import {editor, languages, Uri, Range, MarkerTag, MarkerSeverity} from "monaco-editor";

//#region utils copied from typescript to prevent loading the entire typescriptServices ---

enum IndentStyle {
	None = 0,
	Block = 1,
	Smart = 2,
}

export function flattenDiagnosticMessageText(
	diag: string | ts.DiagnosticMessageChain | undefined,
	newLine: string,
	indent = 0
): string {
	if (typeof diag === "string") {
		return diag;
	} else if (diag === undefined) {
		return "";
	}
	let result = "";
	if (indent) {
		result += newLine;

		for (let i = 0; i < indent; i++) {
			result += "  ";
		}
	}
	result += diag.messageText;
	indent++;
	if (diag.next) {
		for (const kid of diag.next) {
			result += flattenDiagnosticMessageText(kid, newLine, indent);
		}
	}
	return result;
}

function displayPartsToString(displayParts: ts.SymbolDisplayPart[] | undefined): string {
	if (displayParts) {
		return displayParts.map(displayPart => displayPart.text).join("");
	}
	return "";
}

//#endregion

export abstract class Adapter {
	constructor(protected worker: (...uris: Uri[]) => Promise<TypeScriptWorker>) {}

	protected textSpanToRange(model: editor.ITextModel, span: ts.TextSpan): IRange {
		const p1 = model.getPositionAt(span.start);
		const p2 = model.getPositionAt(span.start + span.length);
		const {lineNumber: startLineNumber, column: startColumn} = p1;
		const {lineNumber: endLineNumber, column: endColumn} = p2;
		return {startLineNumber, startColumn, endLineNumber, endColumn};
	}
}

// --- lib files

export class LibFiles {
	private libFiles: Record<string, string> = {};
	private hasFetchedLibFiles = false;
	private fetchLibFilesPromise?: Promise<void>;

	constructor(private readonly worker: (...uris: Uri[]) => Promise<TypeScriptWorker>) {}

	public isLibFile(uri: Uri | null): boolean {
		if (!uri) {
			return false;
		}
		return false;
	}

	public getOrCreateModel(fileName: string): editor.ITextModel | null {
		const uri = Uri.parse(fileName);
		const model = editor.getModel(uri);
		if (model) {
			return model;
		}
		if (this.isLibFile(uri) && this.hasFetchedLibFiles) {
			return editor.createModel(this.libFiles[uri.path.slice(1)], "typescript", uri);
		}
		return null;
	}

	private containsLibFile(uris: (Uri | null)[]): boolean {
		for (const uri of uris) {
			if (this.isLibFile(uri)) {
				return true;
			}
		}
		return false;
	}

	public async fetchLibFilesIfNecessary(uris: (Uri | null)[]): Promise<void> {
		if (!this.containsLibFile(uris)) {
			// no lib files necessary
			return;
		}
		await (this.fetchLibFilesPromise ??= this.fetchLibFiles());
	}

	private async fetchLibFiles() {
		const worker = await this.worker();
		this.libFiles = await worker.getLibFiles();
		this.hasFetchedLibFiles = true;
	}
}

// --- diagnostics --- ---

enum DiagnosticCategory {
	Warning = 0,
	Error = 1,
	Suggestion = 2,
	Message = 3,
}

/**
 * temporary interface until the editor API exposes
 * `IModel.isAttachedToEditor` and `IModel.onDidChangeAttached`
 */
interface IInternalEditorModel extends editor.IModel {
	onDidChangeAttached(listener: () => void): IDisposable;
	isAttachedToEditor(): boolean;
}

export class DiagnosticsAdapter extends Adapter {
	private disposables: IDisposable[] = [];
	private listener: {[uri: string]: IDisposable} = Object.create(null);

	constructor(
		private readonly libFiles: LibFiles,
		private defaults: LanguageServiceDefaults,
		private selector: string,
		worker: (...uris: Uri[]) => Promise<TypeScriptWorker>
	) {
		super(worker);

		const onModelAdd = (model: IInternalEditorModel): void => {
			if (model.getLanguageId() !== selector) {
				return;
			}

			const maybeValidate = () => {
				const {onlyVisible} = this.defaults.getDiagnosticsOptions();
				if (onlyVisible) {
					if (model.isAttachedToEditor()) {
						this.doValidate(model);
					}
				} else {
					this.doValidate(model);
				}
			};

			let handle: number;
			const changeSubscription = model.onDidChangeContent(() => {
				clearTimeout(handle);
				handle = window.setTimeout(maybeValidate, 500);
			});

			const visibleSubscription = model.onDidChangeAttached(() => {
				const {onlyVisible} = this.defaults.getDiagnosticsOptions();
				if (onlyVisible) {
					if (model.isAttachedToEditor()) {
						// this model is now attached to an editor
						// => compute diagnostics
						maybeValidate();
					} else {
						// this model is no longer attached to an editor
						// => clear existing diagnostics
						editor.setModelMarkers(model, this.selector, []);
					}
				}
			});

			this.listener[model.uri.toString()] = {
				dispose() {
					changeSubscription.dispose();
					visibleSubscription.dispose();
					clearTimeout(handle);
				},
			};

			maybeValidate();
		};

		const onModelRemoved = (model: editor.IModel): void => {
			editor.setModelMarkers(model, this.selector, []);
			const key = model.uri.toString();
			if (this.listener[key]) {
				this.listener[key].dispose();
				delete this.listener[key];
			}
		};

		this.disposables.push(editor.onDidCreateModel(model => onModelAdd(model as IInternalEditorModel)));
		this.disposables.push(editor.onWillDisposeModel(onModelRemoved));
		this.disposables.push(
			editor.onDidChangeModelLanguage(event => {
				onModelRemoved(event.model);
				onModelAdd(event.model as IInternalEditorModel);
			})
		);

		this.disposables.push({
			dispose() {
				for (const model of editor.getModels()) {
					onModelRemoved(model);
				}
			},
		});

		const recomputeDiagostics = () => {
			// redo diagnostics when options change
			for (const model of editor.getModels()) {
				onModelRemoved(model);
				onModelAdd(model as IInternalEditorModel);
			}
		};
		this.disposables.push(this.defaults.onDidChange(recomputeDiagostics));
		this.disposables.push(this.defaults.onDidExtraLibsChange(recomputeDiagostics));

		editor.getModels().forEach(model => onModelAdd(model as IInternalEditorModel));
	}

	public dispose(): void {
		this.disposables.forEach(d => d && d.dispose());
		this.disposables = [];
	}

	private async doValidate(model: editor.ITextModel): Promise<void> {
		const worker = await this.worker(model.uri);

		if (model.isDisposed()) {
			// model was disposed in the meantime
			return;
		}

		const promises: Promise<Diagnostic[]>[] = [];
		const {noSyntaxValidation, noSemanticValidation, noSuggestionDiagnostics} =
			this.defaults.getDiagnosticsOptions();
		if (!noSyntaxValidation) {
			promises.push(worker.getSyntacticDiagnostics(model.uri.toString()));
		}
		if (!noSemanticValidation) {
			promises.push(worker.getSemanticDiagnostics(model.uri.toString()));
		}
		if (!noSuggestionDiagnostics) {
			promises.push(worker.getSuggestionDiagnostics(model.uri.toString()));
		}

		const allDiagnostics = await Promise.all(promises);

		if (!allDiagnostics || model.isDisposed()) {
			// model was disposed in the meantime
			return;
		}

		const diagnostics = allDiagnostics
			.reduce((p, c) => c.concat(p), [])
			.filter(d => (this.defaults.getDiagnosticsOptions().diagnosticCodesToIgnore || []).indexOf(d.code) === -1);

		// Fetch lib files if necessary
		const relatedUris = diagnostics
			.map(d => d.relatedInformation || [])
			.reduce((p, c) => c.concat(p), [])
			.map(relatedInformation => (relatedInformation.file ? Uri.parse(relatedInformation.file.fileName) : null));

		await this.libFiles.fetchLibFilesIfNecessary(relatedUris);

		if (model.isDisposed()) {
			// model was disposed in the meantime
			return;
		}

		editor.setModelMarkers(
			model,
			this.selector,
			diagnostics.map(d => this.convertDiagnostics(model, d))
		);
	}

	private convertDiagnostics(model: editor.ITextModel, diag: Diagnostic): editor.IMarkerData {
		const diagStart = diag.start || 0;
		const diagLength = diag.length || 1;
		const {lineNumber: startLineNumber, column: startColumn} = model.getPositionAt(diagStart);
		const {lineNumber: endLineNumber, column: endColumn} = model.getPositionAt(diagStart + diagLength);

		const tags: MarkerTag[] = [];
		if (diag.reportsUnnecessary) {
			tags.push(MarkerTag.Unnecessary);
		}
		if (diag.reportsDeprecated) {
			tags.push(MarkerTag.Deprecated);
		}

		return {
			severity: this.tsDiagnosticCategoryToMarkerSeverity(diag.category),
			startLineNumber,
			startColumn,
			endLineNumber,
			endColumn,
			message: flattenDiagnosticMessageText(diag.messageText, "\n"),
			code: diag.code.toString(),
			tags,
			relatedInformation: this.convertRelatedInformation(model, diag.relatedInformation),
		};
	}

	private convertRelatedInformation(
		model: editor.ITextModel,
		relatedInformation?: DiagnosticRelatedInformation[]
	): editor.IRelatedInformation[] {
		if (!relatedInformation) {
			return [];
		}

		const result: editor.IRelatedInformation[] = [];
		relatedInformation.forEach(info => {
			let relatedResource: editor.ITextModel | null = model;
			if (info.file) {
				relatedResource = this.libFiles.getOrCreateModel(info.file.fileName);
			}

			if (!relatedResource) {
				return;
			}
			const infoStart = info.start || 0;
			const infoLength = info.length || 1;
			const {lineNumber: startLineNumber, column: startColumn} = relatedResource.getPositionAt(infoStart);
			const {lineNumber: endLineNumber, column: endColumn} = relatedResource.getPositionAt(
				infoStart + infoLength
			);

			result.push({
				resource: relatedResource.uri,
				startLineNumber,
				startColumn,
				endLineNumber,
				endColumn,
				message: flattenDiagnosticMessageText(info.messageText, "\n"),
			});
		});
		return result;
	}

	private tsDiagnosticCategoryToMarkerSeverity(category: ts.DiagnosticCategory): MarkerSeverity {
		switch (category) {
			case DiagnosticCategory.Error:
				return MarkerSeverity.Error;
			case DiagnosticCategory.Message:
				return MarkerSeverity.Info;
			case DiagnosticCategory.Warning:
				return MarkerSeverity.Warning;
			case DiagnosticCategory.Suggestion:
				return MarkerSeverity.Hint;
		}
		return MarkerSeverity.Info;
	}
}

// --- suggest ------

interface MyCompletionItem extends languages.CompletionItem {
	label: string;
	uri: Uri;
	position: Position;
	offset: number;
}

export class SuggestAdapter extends Adapter implements languages.CompletionItemProvider {
	public get triggerCharacters(): string[] {
		return ["."];
	}

	public async provideCompletionItems(
		model: editor.ITextModel,
		position: Position,

		context: languages.CompletionContext
	): Promise<languages.CompletionList | undefined> {
		const wordInfo = model.getWordUntilPosition(position);
		const wordRange = new Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
		const resource = model.uri;
		const offset = model.getOffsetAt(position);

		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getCompletionsAtPosition(resource.toString(), offset);

		if (!info || model.isDisposed()) {
			return;
		}

		const suggestions: MyCompletionItem[] = info.entries.map(entry => {
			let range = wordRange;
			if (entry.replacementSpan) {
				const p1 = model.getPositionAt(entry.replacementSpan.start);
				const p2 = model.getPositionAt(entry.replacementSpan.start + entry.replacementSpan.length);
				range = new Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
			}

			const tags: languages.CompletionItemTag[] = [];
			if (entry.kindModifiers !== undefined && entry.kindModifiers.indexOf("deprecated") !== -1) {
				tags.push(languages.CompletionItemTag.Deprecated);
			}

			return {
				uri: resource,
				position: position,
				offset: offset,
				range: range,
				label: entry.name,
				insertText: entry.name,
				sortText: entry.sortText,
				kind: SuggestAdapter.convertKind(entry.kind),
				tags,
			};
		});

		return {
			suggestions,
		};
	}

	public async resolveCompletionItem(item: MyCompletionItem): Promise<MyCompletionItem> {
		const worker = await this.worker(item.uri);
		const details = await worker.getCompletionEntryDetails(item.uri.toString(), item.offset, item.label);

		if (!details) {
			return item;
		}

		return {
			...item,
			label: details.name,
			kind: SuggestAdapter.convertKind(details.kind),
			detail: displayPartsToString(details.displayParts),
			documentation: {
				value: SuggestAdapter.createDocumentationString(details),
			},
		};
	}

	private static convertKind(kind: string): languages.CompletionItemKind {
		switch (kind) {
			case Kind.primitiveType:
			case Kind.keyword:
				return languages.CompletionItemKind.Keyword;
			case Kind.variable:
			case Kind.localVariable:
				return languages.CompletionItemKind.Variable;
			case Kind.memberVariable:
			case Kind.memberGetAccessor:
			case Kind.memberSetAccessor:
				return languages.CompletionItemKind.Field;
			case Kind.function:
			case Kind.memberFunction:
			case Kind.constructSignature:
			case Kind.callSignature:
			case Kind.indexSignature:
				return languages.CompletionItemKind.Function;
			case Kind.enum:
				return languages.CompletionItemKind.Enum;
			case Kind.module:
				return languages.CompletionItemKind.Module;
			case Kind.class:
				return languages.CompletionItemKind.Class;
			case Kind.interface:
				return languages.CompletionItemKind.Interface;
			case Kind.warning:
				return languages.CompletionItemKind.File;
		}

		return languages.CompletionItemKind.Property;
	}

	private static createDocumentationString(details: ts.CompletionEntryDetails): string {
		let documentationString = displayPartsToString(details.documentation);
		if (details.tags) {
			for (const tag of details.tags) {
				documentationString += `\n\n${tagToString(tag)}`;
			}
		}
		return documentationString;
	}
}

function tagToString(tag: ts.JSDocTagInfo): string {
	let tagLabel = `*@${tag.name}*`;
	if (tag.name === "param" && tag.text) {
		const [paramName, ...rest] = tag.text;
		tagLabel += `\`${paramName.text}\``;
		if (rest.length > 0) tagLabel += ` — ${rest.map(r => r.text).join(" ")}`;
	} else if (Array.isArray(tag.text)) {
		tagLabel += ` — ${tag.text.map(r => r.text).join(" ")}`;
	} else if (tag.text) {
		tagLabel += ` — ${tag.text}`;
	}
	return tagLabel;
}

export class SignatureHelpAdapter extends Adapter implements languages.SignatureHelpProvider {
	public signatureHelpTriggerCharacters = ["(", ","];

	private toSignatureHelpTriggerReason(context: languages.SignatureHelpContext): ts.SignatureHelpTriggerReason {
		switch (context.triggerKind) {
			case languages.SignatureHelpTriggerKind.TriggerCharacter:
				if (context.triggerCharacter) {
					if (context.isRetrigger) {
						return {
							kind: "retrigger",
							triggerCharacter: context.triggerCharacter as ts.SignatureHelpRetriggerCharacter,
						};
					} else {
						return {
							kind: "characterTyped",
							triggerCharacter: context.triggerCharacter as ts.SignatureHelpTriggerCharacter,
						};
					}
				} else {
					return {kind: "invoked"};
				}

			case languages.SignatureHelpTriggerKind.ContentChange:
				return context.isRetrigger ? {kind: "retrigger"} : {kind: "invoked"};

			case languages.SignatureHelpTriggerKind.Invoke:
			default:
				return {kind: "invoked"};
		}
	}

	public async provideSignatureHelp(
		model: editor.ITextModel,
		position: Position,
		token: CancellationToken,
		context: languages.SignatureHelpContext
	): Promise<languages.SignatureHelpResult | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getSignatureHelpItems(resource.toString(), offset, {
			triggerReason: this.toSignatureHelpTriggerReason(context),
		});

		if (!info || model.isDisposed()) {
			return;
		}

		const ret: languages.SignatureHelp = {
			activeSignature: info.selectedItemIndex,
			activeParameter: info.argumentIndex,
			signatures: [],
		};

		info.items.forEach(item => {
			const signature: languages.SignatureInformation = {
				label: "",
				parameters: [],
			};

			signature.documentation = {
				value: displayPartsToString(item.documentation),
			};
			signature.label += displayPartsToString(item.prefixDisplayParts);
			item.parameters.forEach((p, i, a) => {
				const label = displayPartsToString(p.displayParts);
				const parameter: languages.ParameterInformation = {
					label: label,
					documentation: {
						value: displayPartsToString(p.documentation),
					},
				};
				signature.label += label;
				signature.parameters.push(parameter);
				if (i < a.length - 1) {
					signature.label += displayPartsToString(item.separatorDisplayParts);
				}
			});
			signature.label += displayPartsToString(item.suffixDisplayParts);
			ret.signatures.push(signature);
		});

		return {
			value: ret,
			dispose() {},
		};
	}
}

// --- hover ------

export class QuickInfoAdapter extends Adapter implements languages.HoverProvider {
	public async provideHover(model: editor.ITextModel, position: Position): Promise<languages.Hover | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getQuickInfoAtPosition(resource.toString(), offset);

		if (!info || model.isDisposed()) {
			return;
		}

		const documentation = displayPartsToString(info.documentation);
		const tags = info.tags ? info.tags.map(tag => tagToString(tag)).join("  \n\n") : "";
		const contents = displayPartsToString(info.displayParts);
		return {
			range: this.textSpanToRange(model, info.textSpan),
			contents: [
				{
					value: `\`\`\`typescript\n${contents}\n\`\`\`\n`,
				},
				{
					value: documentation + (tags ? `\n\n${tags}` : ""),
				},
			],
		};
	}
}

// --- occurrences ------

export class DocumentHighlightAdapter extends Adapter implements languages.DocumentHighlightProvider {
	public async provideDocumentHighlights(
		model: editor.ITextModel,
		position: Position
	): Promise<languages.DocumentHighlight[] | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const entries = await worker.getDocumentHighlights(resource.toString(), offset, [resource.toString()]);

		if (!entries || model.isDisposed()) {
			return;
		}

		return entries.flatMap(entry =>
			entry.highlightSpans.map<languages.DocumentHighlight>(highlightSpans => ({
				range: this.textSpanToRange(model, highlightSpans.textSpan),
				kind:
					highlightSpans.kind === "writtenReference"
						? languages.DocumentHighlightKind.Write
						: languages.DocumentHighlightKind.Text,
			}))
		);
	}
}

// --- definition ------

export class DefinitionAdapter extends Adapter {
	constructor(private readonly libFiles: LibFiles, worker: (...uris: Uri[]) => Promise<TypeScriptWorker>) {
		super(worker);
	}

	public async provideDefinition(
		model: editor.ITextModel,
		position: Position
	): Promise<languages.Definition | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const entries = await worker.getDefinitionAtPosition(resource.toString(), offset);

		if (!entries || model.isDisposed()) {
			return;
		}

		// Fetch lib files if necessary
		await this.libFiles.fetchLibFilesIfNecessary(entries.map(entry => Uri.parse(entry.fileName)));

		if (model.isDisposed()) {
			return;
		}

		const result: languages.Location[] = [];
		for (const entry of entries) {
			const refModel = this.libFiles.getOrCreateModel(entry.fileName);
			if (refModel) {
				result.push({
					uri: refModel.uri,
					range: this.textSpanToRange(refModel, entry.textSpan),
				});
			}
		}
		return result;
	}
}

// --- references ------

export class ReferenceAdapter extends Adapter implements languages.ReferenceProvider {
	constructor(private readonly libFiles: LibFiles, worker: (...uris: Uri[]) => Promise<TypeScriptWorker>) {
		super(worker);
	}

	public async provideReferences(
		model: editor.ITextModel,
		position: Position
	): Promise<languages.Location[] | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const entries = await worker.getReferencesAtPosition(resource.toString(), offset);

		if (!entries || model.isDisposed()) {
			return;
		}

		// Fetch lib files if necessary
		await this.libFiles.fetchLibFilesIfNecessary(entries.map(entry => Uri.parse(entry.fileName)));

		if (model.isDisposed()) {
			return;
		}

		const result: languages.Location[] = [];
		for (const entry of entries) {
			const refModel = this.libFiles.getOrCreateModel(entry.fileName);
			if (refModel) {
				result.push({
					uri: refModel.uri,
					range: this.textSpanToRange(refModel, entry.textSpan),
				});
			}
		}
		return result;
	}
}

// --- outline ------

export class OutlineAdapter extends Adapter implements languages.DocumentSymbolProvider {
	public async provideDocumentSymbols(model: editor.ITextModel): Promise<languages.DocumentSymbol[] | undefined> {
		const resource = model.uri;
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const root = await worker.getNavigationTree(resource.toString());

		if (!root || model.isDisposed()) {
			return;
		}

		const convert = (item: ts.NavigationTree, containerLabel?: string): languages.DocumentSymbol => {
			const result: languages.DocumentSymbol = {
				name: item.text,
				detail: "",
				kind: (outlineTypeTable[item.kind] || languages.SymbolKind.Variable) as languages.SymbolKind,
				range: this.textSpanToRange(model, item.spans[0]),
				selectionRange: this.textSpanToRange(model, item.spans[0]),
				tags: [],
				children: item.childItems?.map(child => convert(child, item.text)),
				containerName: containerLabel,
			};
			return result;
		};

		// Exclude the root node, as it alwas spans the entire document.
		const result = root.childItems ? root.childItems.map(item => convert(item)) : [];
		return result;
	}
}

export class Kind {
	public static unknown: string = "";
	public static keyword: string = "keyword";
	public static script: string = "script";
	public static module: string = "module";
	public static class: string = "class";
	public static interface: string = "interface";
	public static type: string = "type";
	public static enum: string = "enum";
	public static variable: string = "var";
	public static localVariable: string = "local var";
	public static function: string = "function";
	public static localFunction: string = "local function";
	public static memberFunction: string = "method";
	public static memberGetAccessor: string = "getter";
	public static memberSetAccessor: string = "setter";
	public static memberVariable: string = "property";
	public static constructorImplementation: string = "constructor";
	public static callSignature: string = "call";
	public static indexSignature: string = "index";
	public static constructSignature: string = "construct";
	public static parameter: string = "parameter";
	public static typeParameter: string = "type parameter";
	public static primitiveType: string = "primitive type";
	public static label: string = "label";
	public static alias: string = "alias";
	public static const: string = "const";
	public static let: string = "let";
	public static warning: string = "warning";
}

const outlineTypeTable: {
	[kind: string]: languages.SymbolKind;
} = Object.create(null);
outlineTypeTable[Kind.module] = languages.SymbolKind.Module;
outlineTypeTable[Kind.class] = languages.SymbolKind.Class;
outlineTypeTable[Kind.enum] = languages.SymbolKind.Enum;
outlineTypeTable[Kind.interface] = languages.SymbolKind.Interface;
outlineTypeTable[Kind.memberFunction] = languages.SymbolKind.Method;
outlineTypeTable[Kind.memberVariable] = languages.SymbolKind.Property;
outlineTypeTable[Kind.memberGetAccessor] = languages.SymbolKind.Property;
outlineTypeTable[Kind.memberSetAccessor] = languages.SymbolKind.Property;
outlineTypeTable[Kind.variable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.const] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.localVariable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.variable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.function] = languages.SymbolKind.Function;
outlineTypeTable[Kind.localFunction] = languages.SymbolKind.Function;

// --- formatting ----

export abstract class FormatHelper extends Adapter {
	protected convertOptions(options: languages.FormattingOptions): ts.FormatCodeSettings {
		return {
			convertTabsToSpaces: options.insertSpaces,
			tabSize: options.tabSize,
			indentSize: options.tabSize,
			indentStyle: IndentStyle.Smart,
			newLineCharacter: "\n",
			insertSpaceAfterCommaDelimiter: true,
			insertSpaceAfterSemicolonInForStatements: true,
			insertSpaceBeforeAndAfterBinaryOperators: true,
			insertSpaceAfterKeywordsInControlFlowStatements: true,
			insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
			insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
			placeOpenBraceOnNewLineForControlBlocks: false,
			placeOpenBraceOnNewLineForFunctions: false,
		};
	}

	protected convertTextChanges(model: editor.ITextModel, change: ts.TextChange): languages.TextEdit {
		return {
			text: change.newText,
			range: this.textSpanToRange(model, change.span),
		};
	}
}

export class FormatAdapter extends FormatHelper implements languages.DocumentRangeFormattingEditProvider {
	public readonly canFormatMultipleRanges = false;

	public async provideDocumentRangeFormattingEdits(
		model: editor.ITextModel,
		range: Range,
		options: languages.FormattingOptions
	): Promise<languages.TextEdit[] | undefined> {
		const resource = model.uri;
		const startOffset = model.getOffsetAt({
			lineNumber: range.startLineNumber,
			column: range.startColumn,
		});
		const endOffset = model.getOffsetAt({
			lineNumber: range.endLineNumber,
			column: range.endColumn,
		});
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const edits = await worker.getFormattingEditsForRange(
			resource.toString(),
			startOffset,
			endOffset,
			this.convertOptions(options)
		);

		if (!edits || model.isDisposed()) {
			return;
		}

		return edits.map(edit => this.convertTextChanges(model, edit));
	}
}

export class FormatOnTypeAdapter extends FormatHelper implements languages.OnTypeFormattingEditProvider {
	public get autoFormatTriggerCharacters() {
		return [";", "}", "\n"];
	}

	public async provideOnTypeFormattingEdits(
		model: editor.ITextModel,
		position: Position,
		ch: string,
		options: languages.FormattingOptions
	): Promise<languages.TextEdit[] | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const edits = await worker.getFormattingEditsAfterKeystroke(
			resource.toString(),
			offset,
			ch,
			this.convertOptions(options)
		);

		if (!edits || model.isDisposed()) {
			return;
		}

		return edits.map(edit => this.convertTextChanges(model, edit));
	}
}

// --- code actions ------

export class CodeActionAdaptor extends FormatHelper implements languages.CodeActionProvider {
	public async provideCodeActions(
		model: editor.ITextModel,
		range: Range,
		context: languages.CodeActionContext
	): Promise<languages.CodeActionList | undefined> {
		const resource = model.uri;
		const start = model.getOffsetAt({
			lineNumber: range.startLineNumber,
			column: range.startColumn,
		});
		const end = model.getOffsetAt({
			lineNumber: range.endLineNumber,
			column: range.endColumn,
		});
		const formatOptions = this.convertOptions(model.getOptions());
		const errorCodes = context.markers
			.filter(m => m.code)
			.map(m => m.code)
			.map(Number);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const codeFixes = await worker.getCodeFixesAtPosition(
			resource.toString(),
			start,
			end,
			errorCodes,
			formatOptions
		);

		if (!codeFixes || model.isDisposed()) {
			return {actions: [], dispose: () => {}};
		}

		const actions = codeFixes
			.filter(fix => {
				// Removes any 'make a new file'-type code fix
				return fix.changes.filter(change => change.isNewFile).length === 0;
			})
			.map(fix => {
				return this.tsCodeFixActionToMonacoCodeAction(model, context, fix);
			});

		return {
			actions: actions,
			dispose: () => {},
		};
	}

	private tsCodeFixActionToMonacoCodeAction(
		model: editor.ITextModel,
		context: languages.CodeActionContext,
		codeFix: ts.CodeFixAction
	): languages.CodeAction {
		const edits: languages.IWorkspaceTextEdit[] = [];
		for (const change of codeFix.changes) {
			for (const textChange of change.textChanges) {
				edits.push({
					resource: model.uri,
					versionId: undefined,
					textEdit: {
						range: this.textSpanToRange(model, textChange.span),
						text: textChange.newText,
					},
				});
			}
		}

		const action: languages.CodeAction = {
			title: codeFix.description,
			edit: {edits: edits},
			diagnostics: context.markers,
			kind: "quickfix",
		};

		return action;
	}
}
// --- rename ----

export class RenameAdapter extends Adapter implements languages.RenameProvider {
	constructor(private readonly libFiles: LibFiles, worker: (...uris: Uri[]) => Promise<TypeScriptWorker>) {
		super(worker);
	}
	public async provideRenameEdits(
		model: editor.ITextModel,
		position: Position,
		newName: string
	): Promise<(languages.WorkspaceEdit & languages.Rejection) | undefined> {
		const resource = model.uri;
		const fileName = resource.toString();
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const renameInfo = await worker.getRenameInfo(fileName, offset, {
			allowRenameOfImportPath: false,
		});
		if (renameInfo.canRename === false) {
			// use explicit comparison so that the discriminated union gets resolved properly
			return {
				edits: [],
				rejectReason: renameInfo.localizedErrorMessage,
			};
		}
		if (renameInfo.fileToRename !== undefined) {
			throw new Error("Renaming files is not supported.");
		}

		const renameLocations = await worker.findRenameLocations(
			fileName,
			offset,
			/*strings*/ false,
			/*comments*/ false,
			/*prefixAndSuffix*/ false
		);

		if (!renameLocations || model.isDisposed()) {
			return;
		}

		const edits: languages.IWorkspaceTextEdit[] = [];
		for (const renameLocation of renameLocations) {
			const model = this.libFiles.getOrCreateModel(renameLocation.fileName);
			if (model) {
				edits.push({
					resource: model.uri,
					versionId: undefined,
					textEdit: {
						range: this.textSpanToRange(model, renameLocation.textSpan),
						text: newName,
					},
				});
			} else {
				throw new Error(`Unknown file ${renameLocation.fileName}.`);
			}
		}

		return {edits};
	}
}

// --- inlay hints ----

export class InlayHintsAdapter extends Adapter implements languages.InlayHintsProvider {
	public async provideInlayHints(model: editor.ITextModel, range: Range): Promise<languages.InlayHintList | null> {
		const resource = model.uri;
		const fileName = resource.toString();
		const start = model.getOffsetAt({
			lineNumber: range.startLineNumber,
			column: range.startColumn,
		});
		const end = model.getOffsetAt({
			lineNumber: range.endLineNumber,
			column: range.endColumn,
		});
		const worker = await this.worker(resource);
		if (model.isDisposed()) {
			return null;
		}

		const tsHints = await worker.provideInlayHints(fileName, start, end);
		const hints: languages.InlayHint[] = tsHints.map(hint => {
			return {
				...hint,
				label: hint.text,
				position: model.getPositionAt(hint.position),
				kind: this.convertHintKind(hint.kind),
			};
		});
		return {hints, dispose: () => {}};
	}

	private convertHintKind(kind?: ts.InlayHintKind) {
		switch (kind) {
			case "Parameter":
				return languages.InlayHintKind.Parameter;
			case "Type":
				return languages.InlayHintKind.Type;
			default:
				return languages.InlayHintKind.Type;
		}
	}
}
