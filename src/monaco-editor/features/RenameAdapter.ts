import {languages, type editor, type Position} from "monaco-editor";
import type {TypeScriptMode} from "../tsMode.ts";
import {Adapter} from "./Adapter.ts";
import type {LibFiles} from "./LibFiles.ts";

@Adapter.providedBy(languages.registerRenameProvider)
export class RenameAdapter extends Adapter implements languages.RenameProvider {
	private readonly libFiles: LibFiles;
	constructor(libFiles: LibFiles, worker: TypeScriptMode) {
		super(worker);
		this.libFiles = libFiles;
	}
	public async provideRenameEdits(
		model: editor.ITextModel,
		position: Position,
		newName: string,
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
		if (!renameInfo.canRename) {
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
			/* strings*/ false,
			/* comments*/ false,
			/* prefixAndSuffix*/ false,
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
