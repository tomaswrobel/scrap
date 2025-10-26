import path from "path";

export class EntityAsset implements File {
	public blobUrl: string;
	private blob: Blob;
	public fullName: string;

	public readonly webkitRelativePath = "";

	public name: string;
	public lastModified: number;

	public get size() {
		return this.blob.size;
	}

	public get type() {
		return this.blob.type;
	}

	constructor(
		fileBits: BlobPart[],
		fileName: string,
		{lastModified = Date.now(), ...options}: FilePropertyBag = {},
	) {
		this.fullName = fileName;
		this.name = $state(path.basename(fileName));
		this.lastModified = $state(lastModified);
		this.blob = new Blob(fileBits, options);
		this.blobUrl = URL.createObjectURL(this.blob);
	}

	public replaceWith(fileBits: BlobPart[], type = this.type) {
		URL.revokeObjectURL(this.blobUrl);
		this.blob = new Blob(fileBits, {type});
		this.blobUrl = URL.createObjectURL(this.blob);
		this.lastModified = Date.now();
	}

	public bytes(): Promise<Uint8Array<ArrayBuffer>> {
		return this.blob.bytes();
	}

	public arrayBuffer(): Promise<ArrayBuffer> {
		return this.blob.arrayBuffer();
	}

	public slice(start?: number, end?: number, contentType?: string): Blob {
		return this.blob.slice(start, end, contentType);
	}

	public stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return this.blob.stream();
	}

	public text(): Promise<string> {
		return this.blob.text();
	}

	public static fromDataURL(dataURL: string, fileName: string) {
		const parts = dataURL.split(";");
		const [, type] = parts[0].split(":");
		const [, base64Data] = parts[1].split(",");
		const binaryString = window.atob(base64Data);
		const bytes = new Uint8Array(binaryString.length);

		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		return new this([bytes], fileName, {type});
	}

	public static fromFile(file: File) {
		return new this([file], file.name, {type: file.type});
	}
}
