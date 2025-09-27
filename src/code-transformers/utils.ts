/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Transforming utilities
 * @copyright Tomáš Wróbel 2025
 */
/**
 * List of reserved words in JavaScript.
 * This list is based on the ECMAScript specification and
 * includes global objects available in the browser.
 */
export const reservedWords = Object.getOwnPropertyNames(window);
reservedWords.unshift(
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

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum Order {
	ATOMIC = 0, // 0 "" ...
	NEW = 1.1, // new
	MEMBER = 1.2, // . []
	FUNCTION_CALL = 2, // ()
	INCREMENT = 3, // ++
	DECREMENT = 3, // --
	BITWISE_NOT = 4.1, // ~
	UNARY_PLUS = 4.2, // +
	UNARY_NEGATION = 4.3, // -
	LOGICAL_NOT = 4.4, // !
	TYPEOF = 4.5, // typeof
	VOID = 4.6, // void
	DELETE = 4.7, // delete
	AWAIT = 4.8, // await
	EXPONENTIATION = 5.0, // **
	MULTIPLICATION = 5.1, // *
	DIVISION = 5.2, // /
	MODULUS = 5.3, // %
	SUBTRACTION = 6.1, // -
	ADDITION = 6.2, // +
	BITWISE_SHIFT = 7, // << >> >>>
	RELATIONAL = 8, // < <= > >=
	IN = 8, // in
	INSTANCEOF = 8, // instanceof
	EQUALITY = 9, // == != === !==
	BITWISE_AND = 10, // &
	BITWISE_XOR = 11, // ^
	BITWISE_OR = 12, // |
	LOGICAL_AND = 13, // &&
	LOGICAL_OR = 14, // ||
	CONDITIONAL = 15, // ?:
	ASSIGNMENT = 16, // : += -= **= *= /= %= <<= >>= ...
	YIELD = 17, // yield
	COMMA = 18, // ,
	NONE = 99, // (...)
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

/**
 * Escapes a string to make it a valid JavaScript identifier.
 *
 * Idea taken from:
 * https://github.com/smallhelm/to-js-identifier
 *
 * Which is licensed under the MIT license
 * (C) 2016 Small Helm LLC
 *
 * @param string String to escape.
 * @returns A valid JavaScript identifier.
 */
export function escape(string: string) {
	const result = string.replace(/(^[^a-zA-Z_])|([^a-zA-Z_0-9])/g, (bad: string) => `$${bad.charCodeAt(0)}$`);

	if (reservedWords.includes(result)) {
		return `$${result}$`;
	}

	return result;
}
