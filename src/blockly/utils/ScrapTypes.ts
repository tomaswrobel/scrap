/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview The list of ScrapTypes.
 * @copyright Tomáš Wróbel 2025
 */

/**
 * The list of ScrapTypes. First element is empty string and should be
 * replaced by `void`, `unknown`, `never` or `any` (depending on context)
 *
 * ```ts
 * ScrapTypes.map(type => type || "void")
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
