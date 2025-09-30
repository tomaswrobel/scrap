import {languages, type editor, type Range} from "monaco-editor";
import {FormatBaseAdapter} from "./FormatBaseAdapter.ts";

@FormatBaseAdapter.providedBy(languages.registerDocumentRangeFormattingEditProvider)
export class FormatAdapter
	extends FormatBaseAdapter
	implements languages.DocumentRangeFormattingEditProvider
{
	public readonly canFormatMultipleRanges = false;

	public async provideDocumentRangeFormattingEdits(
		model: editor.ITextModel,
		range: Range,
		options: languages.FormattingOptions,
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
			this.convertOptions(options),
		);

		if (model.isDisposed()) {
			return;
		}

		return edits.map(edit => this.convertTextChanges(model, edit));
	}
}
