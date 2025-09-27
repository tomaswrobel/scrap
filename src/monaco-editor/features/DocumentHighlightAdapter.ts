import { languages, type editor, type Position } from "monaco-editor";
import ts from "typescript";
import { Adapter } from "./Adapter.ts";

@Adapter.providedBy(languages.registerDocumentHighlightProvider)
export class DocumentHighlightAdapter
	extends Adapter
	implements languages.DocumentHighlightProvider
{
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

		const entries = await worker.getDocumentHighlights(resource.toString(), offset, [
			resource.toString(),
		]);

		if (!entries || model.isDisposed()) {
			return;
		}

		return entries.flatMap(entry =>
			entry.highlightSpans.map<languages.DocumentHighlight>(highlightSpans => ({
				range: this.textSpanToRange(model, highlightSpans.textSpan),
				kind:
					highlightSpans.kind === ts.HighlightSpanKind.writtenReference
						? languages.DocumentHighlightKind.Write
						: languages.DocumentHighlightKind.Text,
			}))
		);
	}
}
