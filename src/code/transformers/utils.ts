/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Transforming utilities
 * @copyright Tomáš Wróbel 2024
 */
export const reserved = Object.getOwnPropertyNames(window);
reserved.unshift(
	// ECMAScript
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"new",
	"return",
	"super",
	"switch",
	"this",
	"throw",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
	"enum",
	"implements",
	"interface",
	"let",
	"package",
	"private",
	"protected",
	"public",
	"static",
	"await",
	"null",
	"true",
	"false",
	"arguments",
	// Global objects
	"Scrap",
	"Color",
	"$"
);

// Escaping
//
// Idea taken from:
// https://github.com/smallhelm/to-js-identifier
//
// Which is licensed under the MIT license
// (C) 2016 Small Helm LLC
//
// Of course, I had to modify it a lot.

const bad = /(^[^a-zA-Z_])|([^a-zA-Z_0-9])/g;

function dollar(bad: string) {
	return `$${bad.charCodeAt(0)}$`;
}

export function escape(string: string) {
	const result = string.replace(bad, dollar);

	if (reserved.includes(result)) {
		return `$${result}$`;
	}

	return result;
}

export function identifier(this: import("blockly").FieldTextInput, value: string) {
	return (value && reserved.indexOf(value) === -1 && /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(value)) ? value : null;
}