import {basename, extname} from "path";

export function resolveShikiLanguage(path: string): string {
	const extension = extname(path);

	if (extension === basename(path)) {
		if (extension.endsWith("rc")) {
			return "js";
		}
	}

	if (extension === ".xslt") {
		return "xsl";
	}

	if (extension === ".svg") {
		return "xml";
	}

	if (extension === ".htm") {
		return "html";
	}

	return extension.slice(1);
}
