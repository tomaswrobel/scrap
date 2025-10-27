/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Maps Scrap type to its default shadow block.
 * @copyright Tomáš Wróbel 2025
 */
export const TypeToShadowMap: Record<string, string> = {
	number: "math_number",
	string: "iterables_string",
	Color: "block_color",
	Sprite: "sprite",
	Date: "date",
	any: "text_or_number",
};
