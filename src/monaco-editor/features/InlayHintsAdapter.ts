import {languages, type editor, type Range} from "monaco-editor";
import ts from "typescript";
import {Adapter} from "./Adapter";

@Adapter.providedBy(languages.registerInlayHintsProvider)
export class InlayHintsAdapter extends Adapter implements languages.InlayHintsProvider {
	public async provideInlayHints(
		model: editor.ITextModel,
		range: Range,
	): Promise<languages.InlayHintList | null> {
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
		return {
			hints,
			dispose() {
				/* NO-OP */
			},
		};
	}

	private convertHintKind(kind: ts.InlayHintKind) {
		switch (kind) {
			case ts.InlayHintKind.Parameter:
				return languages.InlayHintKind.Parameter;
			case ts.InlayHintKind.Type:
			case ts.InlayHintKind.Enum:
				return languages.InlayHintKind.Type;
		}
	}
}
