import {languages, type editor, type Position} from "monaco-editor";
import {FormatBaseAdapter} from "./FormatBaseAdapter";

@FormatBaseAdapter.providedBy(languages.registerOnTypeFormattingEditProvider)
export class FormatOnTypeAdapter
	extends FormatBaseAdapter
	implements languages.OnTypeFormattingEditProvider
{
	public get autoFormatTriggerCharacters() {
		return [";", "}", "\n"];
	}

	public async provideOnTypeFormattingEdits(
		model: editor.ITextModel,
		position: Position,
		ch: string,
		options: languages.FormattingOptions,
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
			this.convertOptions(options),
		);

		if (model.isDisposed()) {
			return;
		}

		return edits.map(edit => this.convertTextChanges(model, edit));
	}
}
