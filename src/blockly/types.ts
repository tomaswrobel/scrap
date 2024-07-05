/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Type utilities for Scrap.
 */
import type * as Blockly from "blockly";

/**
 * Supported types in Scrap.
 * 
 * First element is an empty string, 
 * which represents both void and any.
 * 
 * Use it as follows:
 * ```ts
 * const types = Types.map(type => type || "any") // or "void"
 * ```
 */
export const Types = [
	"",
	"number", 
	"string", 
	"boolean", 
	"Color", 
	"Array", 
	"Sprite", 
	"Date"
];

/** Error message for invalid type. */
export const Error = `Type must be one of void${Types.join(", ")}`;

/** Converts a type to a shadow type. */
export const TypeToShadow: Record<string, string> = {
	number: "math_number",
	string: "iterables_string",
	Color: "color",
	Sprite: "sprite",
	Date: "date",
	any: "text_or_number"
};

/**
 * Accepts the type block and converts it to a Scrap type.
 * 
 * @param block The block to convert. Supports blocks of type `type`, `union`, `typed`, and `generic`.
 * @returns The JSON representation of the type. This either a string or an array of strings for unions.
 */
export function toCheck(block?: Blockly.Block | null): app.Check {
	if (!block) {
		return "any";
	}
	if (block.type === "type") {
		return block.getFieldValue("TYPE");
	}
	if (block.type === "union") {
		const set = new Set(
			block.inputList.reduce(
				(previous, current) => previous.concat(
					toCheck(current!.connection!.targetBlock())
				),
				[] as string[]
			)
		);

		if (set.size === 1) {
			return set.values().next().value;
		}

		return [...set];
	}
	if (block.type === "typed") {
		return toCheck(block.getInput("TYPE")?.connection?.targetBlock());
	}
	if (block.type === "generic") {
		return block.getFieldValue("ITERABLE");
	}
	return "any";
}