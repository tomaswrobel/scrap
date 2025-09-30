/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Type utilities for Scrap.
 */

/**
 * Supported types in Scrap.
 *
 * First element is an empty string,
 * which represents both void and any.
 *
 * Use it as follows:
 * ```ts
 * const types = ScrapTypes.map(type => type || "any") // or "void"
 * ```
 */
export const ScrapTypes = [
	"",
	"number",
	"string",
	"boolean",
	"Color",
	"Array",
	"Sprite",
	"Date",
];

/** Converts a type to a shadow type. */
export const TypeToShadowMap: Record<string, string> = {
	number: "math_number",
	string: "iterables_string",
	Color: "block_color",
	Sprite: "sprite",
	Date: "date",
	any: "text_or_number",
};
