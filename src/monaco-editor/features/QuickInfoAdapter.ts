import {languages, type editor, type Position} from "monaco-editor";
import ts from "typescript";
import {Adapter} from "./Adapter.ts";
import {tagToString} from "./tagToString.ts";

@Adapter.providedBy(languages.registerHoverProvider)
export class QuickInfoAdapter extends Adapter implements languages.HoverProvider {
	public async provideHover(
		model: editor.ITextModel,
		position: Position,
	): Promise<languages.Hover | undefined> {
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

		const documentation = ts.displayPartsToString(info.documentation);
		const tags = info.tags ? info.tags.map(tag => tagToString(tag)).join("  \n\n") : "";
		const contents = ts.displayPartsToString(info.displayParts);
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
