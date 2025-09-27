export function createFileSystemError(name: string, defaultMessage?: ((path: string) => string) | string) {
	return class FileSystemError extends DOMException {
		public static defaultMessage = defaultMessage;
		public readonly path: string;
		
		constructor(path: string, message = defaultMessage) {
			super(typeof message === "function" ? message(path) : message, name);
			this.path = path;
		}
	};
}

export const InvalidPathError = createFileSystemError(
	"InvalidPathError",
	path => `String '${path}' is not a valid path.`
);
export const EntryNotFoundError = createFileSystemError(
	"EntryNotFoundError",
	path => `Entry '${path}' does not exist.`
);
export const EntryAlreadyExists = createFileSystemError(
	"EntryAlreadyExists",
	path => `Entry '${path}' already exists.`
);
