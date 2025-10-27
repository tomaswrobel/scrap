import {assert} from "./assert";
import {InvalidPathError, EntryAlreadyExists} from "./FileSystemErrors";

export class FileSystem {
	private readonly root: FileSystemDirectoryHandle;

	private constructor(root: FileSystemDirectoryHandle) {
		this.root = root;
	}

	public get name() {
		return this.root.name;
	}

	public static async boot() {
		return new this(await navigator.storage.getDirectory());
	}

	private processFilePath(path: string) {
		const segments = path.split("/");
		const filename = segments.pop();
		assert(filename, new InvalidPathError(path));

		return {segments, filename};
	}

	private async getFileHandle(path: string, {create = false, silent = false}) {
		const {segments, filename} = this.processFilePath(path);
		const directory = await this.getDirectoryFromSegments(segments, create);

		if (!silent && (await this.doesFileExist(filename, directory))) {
			throw new EntryAlreadyExists(path);
		}

		return directory.getFileHandle(filename, {create});
	}

	private async getDirectoryFromSegments(
		[first, ...segments]: string[],
		create: boolean,
		dir = this.root,
	): Promise<FileSystemDirectoryHandle> {
		if (first) {
			return this.getDirectoryFromSegments(
				segments,
				create,
				await dir.getDirectoryHandle(first, {create}),
			);
		} else {
			return dir;
		}
	}

	private async doesFileExist(name: string, dir: FileSystemDirectoryHandle) {
		try {
			await dir.getFileHandle(name);
			return true;
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return false;
			}
			throw e;
		}
	}

	public async writeFile(path: string, data: BlobPart, {type = "", silent = false}) {
		const file = await this.getFileHandle(path, {create: true, silent});
		const blob = data instanceof Blob && !type ? data : new Blob([data], {type});
		const writable = await file.createWritable();
		await writable.write(blob);
		await writable.close();
	}

	public async getFile(path: string) {
		const file = await this.getFileHandle(path, {create: true});
		return file.getFile();
	}

	public async createFilePath(path: string) {
		await this.getFileHandle(path, {create: true});
	}

	public async getDirectory(path: string, create = false) {
		const root = await this.getDirectoryFromSegments(path.split("/"), create);
		return new FileSystem(root);
	}

	public async createDirectory(path: string) {
		await this.getDirectoryFromSegments(path.split("/"), true);
	}

	public async fileExists(path: string) {
		const {segments, filename} = this.processFilePath(path);
		const directory = await this.getDirectoryFromSegments(segments, false);
		return this.doesFileExist(filename, directory);
	}

	public async list(path = "") {
		const dir = await this.getDirectoryFromSegments(path.split("/"), false);
		const result: string[] = [];

		for await (const f of dir.keys()) {
			result.push(f);
		}

		return result;
	}

	public async listContents(path = "") {
		const dir = await this.getDirectoryFromSegments(path.split("/"), false);
		const result: (FileSystem | File)[] = [];

		for await (const f of dir.values()) {
			if (f.kind === "file") {
				result.push(await f.getFile());
			} else {
				result.push(new FileSystem(f));
			}
		}

		return result;
	}
}

declare global {
	interface FileSystemDirectoryHandle {
		keys(): AsyncIterableIterator<string>;
		values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
	}
}
