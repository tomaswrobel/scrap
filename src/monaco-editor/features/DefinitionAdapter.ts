import { languages, Uri, type editor, type Position } from "monaco-editor";
import type { TypeScriptMode } from "../tsMode";
import { Adapter } from "./Adapter.ts";
import type { LibFiles } from "./LibFiles.ts";

@Adapter.providedBy(languages.registerDefinitionProvider)
export class DefinitionAdapter extends Adapter {
	private readonly libFiles: LibFiles;

	constructor(libFiles: LibFiles, worker: TypeScriptMode) {
		super(worker);
		this.libFiles = libFiles;
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
		await this.libFiles.fetchLibFilesIfNecessary(
			entries.map(entry => Uri.parse(entry.fileName))
		);

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
