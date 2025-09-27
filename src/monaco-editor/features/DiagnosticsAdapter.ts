import { bind } from "@scrap/utils/bind.ts";
import {
	editor,
	MarkerSeverity,
	MarkerTag,
	Uri,
	type IDisposable,
	type languages,
} from "monaco-editor";
import { DiagnosticCategory, flattenDiagnosticMessageText } from "typescript";
import type { TypeScriptMode } from "../tsMode.ts";
import { Adapter } from "./Adapter.ts";
import type { LibFiles } from "./LibFiles.ts";

export class DiagnosticsAdapter extends Adapter implements IDisposable {
	private disposables: IDisposable[] = [];
	private listener: Record<string, IDisposable | undefined> = Object.create(null);
	private readonly libFiles: LibFiles;
	private readonly defaults: languages.typescript.LanguageServiceDefaults;
	private selector = "";

	constructor(libFiles: LibFiles, defaults: languages.typescript.LanguageServiceDefaults, worker: TypeScriptMode) {
		super(worker);
		this.libFiles = libFiles;
		this.defaults = defaults;
	}

	public override register(selector: string): IDisposable {
		this.selector = selector;

		this.disposables.push(editor.onDidCreateModel(this.onModelAdd));
		this.disposables.push(editor.onWillDisposeModel(this.onModelRemoved));
		this.disposables.push(
			editor.onDidChangeModelLanguage(event => {
				this.onModelRemoved(event.model);
				this.onModelAdd(event.model);
			})
		);

		this.disposables.push({
			dispose: () => {
				for (const model of editor.getModels()) {
					this.onModelRemoved(model);
				}
			},
		});

		const recomputeDiagostics = () => {
			// redo diagnostics when options change
			for (const model of editor.getModels()) {
				this.onModelRemoved(model);
				this.onModelAdd(model);
			}
		};

		this.disposables.push(this.defaults.onDidChange(recomputeDiagostics));
		this.disposables.push(this.defaults.onDidExtraLibsChange(recomputeDiagostics));

		editor.getModels().forEach(this.onModelAdd);

		return this;
	}

	@bind
	public onModelAdd(model: editor.ITextModel) {
		if (model.getLanguageId() !== this.selector) {
			return;
		}

		const maybeValidate = () => {
			const { onlyVisible } = this.defaults.getDiagnosticsOptions();
			if (onlyVisible) {
				if (model.isAttachedToEditor()) {
					void this.doValidate(model);
				}
			} else {
				void this.doValidate(model);
			}
		};

		let handle: number;
		const changeSubscription = model.onDidChangeContent(() => {
			clearTimeout(handle);
			handle = window.setTimeout(maybeValidate, 500);
		});

		const visibleSubscription = model.onDidChangeAttached(() => {
			const { onlyVisible } = this.defaults.getDiagnosticsOptions();
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
	}

	@bind
	public onModelRemoved(model: editor.IModel) {
		editor.setModelMarkers(model, this.selector, []);
		const key = model.uri.toString();
		if (this.listener[key]) {
			this.listener[key].dispose();
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.listener[key];
		}
	}

	public dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}

	private async doValidate(model: editor.ITextModel): Promise<void> {
		const worker = await this.worker(model.uri);

		if (model.isDisposed()) {
			// model was disposed in the meantime
			return;
		}

		const promises: Promise<languages.typescript.Diagnostic[]>[] = [];
		const { noSyntaxValidation, noSemanticValidation, noSuggestionDiagnostics } =
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

		if (model.isDisposed()) {
			// model was disposed in the meantime
			return;
		}

		const diagnostics = allDiagnostics
			.reduce((p, c) => c.concat(p), [])
			.filter(
				d =>
					!(
						this.defaults.getDiagnosticsOptions().diagnosticCodesToIgnore ?? []
					).includes(d.code)
			);

		// Fetch lib files if necessary
		const relatedUris = diagnostics
			.map(d => d.relatedInformation ?? [])
			.reduce((p, c) => c.concat(p), [])
			.map(relatedInformation =>
				relatedInformation.file ? Uri.parse(relatedInformation.file.fileName) : null
			);

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

	private convertDiagnostics(
		model: editor.ITextModel,
		diag: languages.typescript.Diagnostic
	): editor.IMarkerData {
		const diagStart = diag.start ?? 0;
		const diagLength = diag.length ?? 1;
		const { lineNumber: startLineNumber, column: startColumn } =
			model.getPositionAt(diagStart);
		const { lineNumber: endLineNumber, column: endColumn } = model.getPositionAt(
			diagStart + diagLength
		);

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
		relatedInformation?: languages.typescript.DiagnosticRelatedInformation[]
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
			const infoStart = info.start ?? 0;
			const infoLength = info.length ?? 1;
			const { lineNumber: startLineNumber, column: startColumn } =
				relatedResource.getPositionAt(infoStart);
			const { lineNumber: endLineNumber, column: endColumn } =
				relatedResource.getPositionAt(infoStart + infoLength);

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

	private tsDiagnosticCategoryToMarkerSeverity(category: DiagnosticCategory): MarkerSeverity {
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
