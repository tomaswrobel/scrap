import {languages, type editor, type Range} from "monaco-editor";
import type ts from "typescript";
import {Adapter} from "./Adapter";
import {FormatBaseAdapter} from "./FormatBaseAdapter";

@Adapter.providedBy(languages.registerCodeActionProvider)
export class CodeActionAdaptor
	extends FormatBaseAdapter
	implements languages.CodeActionProvider
{
	public async provideCodeActions(
		model: editor.ITextModel,
		range: Range,
		context: languages.CodeActionContext,
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
			formatOptions,
		);

		if (model.isDisposed()) {
			return {
				actions: [],
				dispose() {
					/* NO-OP */
				},
			};
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
			actions,
			dispose() {
				/* NO-OP */
			},
		};
	}

	private tsCodeFixActionToMonacoCodeAction(
		model: editor.ITextModel,
		context: languages.CodeActionContext,
		codeFix: ts.CodeFixAction,
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
			edit: {edits},
			diagnostics: context.markers,
			kind: "quickfix",
		};

		return action;
	}
}
