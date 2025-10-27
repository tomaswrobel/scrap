import type * as Blockly from "blockly/core";
import type {Check} from "../types/Check";

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
		const set = new Set<string>(
			block.inputList.reduce<string[]>(
				(a, b) => a.concat(blockToCheck(b.connection?.targetBlock())),
				[],
			),
		);

		if (set.size === 1) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
