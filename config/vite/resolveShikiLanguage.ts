/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Resolves shiki language by extension.
 * @copyright Tomáš Wróbel 2025
 */
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
