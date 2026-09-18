import * as path from "path";

export function pathMapToFilenameMap<T>(pathMap: Record<string, T>): Record<string, T> {
	const result: Record<string, T> = {};
	for (const [key, value] of Object.entries(pathMap)) {
		const {name} = path.parse(key);
		result[name] = value;
	}
	return result;
}
