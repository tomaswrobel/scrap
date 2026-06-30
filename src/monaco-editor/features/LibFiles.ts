import {editor, Uri} from "monaco-editor";
import type {TypeScriptMode} from "../tsMode";

export class LibFiles {
	private libFiles: Record<string, string> = {};
	private hasFetchedLibFiles = false;
	private fetchLibFilesPromise?: Promise<void>;
	private readonly worker: TypeScriptMode;

	constructor(worker: TypeScriptMode) {
		this.worker = worker;
	}

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
		if (this.containsLibFile(uris)) {
			await (this.fetchLibFilesPromise ??= this.fetchLibFiles());
		}
	}

	// Ensure lib files are fetched at least once. Useful for features that need
	// typings (completions, signature help) before any diagnostics/related-info
	// triggers fetchLibFilesIfNecessary.
	public async ensureFetched(): Promise<void> {
		await (this.fetchLibFilesPromise ??= this.fetchLibFiles());
	}

	private async fetchLibFiles() {
		const worker = await this.worker();
		this.libFiles = await worker.getLibFiles();
		this.hasFetchedLibFiles = true;
		// create editor models for each lib file so the worker can sync them
		for (const fileName in this.libFiles) {
			const uri = Uri.file(`/${fileName}`);
			if (!editor.getModel(uri)) {
				editor.createModel(this.libFiles[fileName], "typescript", uri);
			}
		}
	}
}
