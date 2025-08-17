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
import type * as Blockly from "blockly/core";

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
export const ScrapTypes = ["", "number", "string", "boolean", "Color", "Array", "Sprite", "Date"];

/** Converts a type to a shadow type. */
export const TypeToShadowMap: Record<string, string> = {
	number: "math_number",
	string: "iterables_string",
	Color: "block_color",
	Sprite: "sprite",
	Date: "date",
	any: "text_or_number",
};

/**
 * Accepts the type block and converts it to a Scrap type.
 *
 * @param block The block to convert. Supports blocks of type `type`, `union`, `typed`, and `generic`.
 * @returns The JSON representation of the type. This either a string or an array of strings for unions.
 */
export function blockToCheck(block?: Blockly.Block | null): Check {
	if (!block) {
		return "any";
	}
	if (block.type === "type") {
		return block.getFieldValue("TYPE");
	}
	if (block.type === "union") {
		const set = new Set(
			block.inputList.reduce(
				(previous, current) => previous.concat(blockToCheck(current.connection!.targetBlock())),
				[] as string[]
			)
		);

		if (set.size === 1) {
			return set.values().next().value!;
		}

		return [...set];
	}
	if (block.type === "typed" || block.type === "array") {
		return blockToCheck(block.getInput("TYPE")?.connection?.targetBlock());
	}
	if (block.type === "generic") {
		return block.getFieldValue("ITERABLE");
	}
	return "any";
}
