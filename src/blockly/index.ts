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
 * @fileoverview @scrap/blockly entry point.
 */
import BlocksToCode from "@scrap/code-transformers/blocksToCode";
import type {CustomBlock} from "@scrap/utils/CustomBlock";
import * as Blockly from "blockly/core";
import {Order} from "blockly/javascript";
import * as En from "blockly/msg/en";
import * as path from "path";
import jsonBlocks from "./data/blocks.json";

import.meta.glob<void>("./fields/*.ts", {eager: true});
import.meta.glob<void>("./plugins/*.ts", {eager: true});

const allExtensions = import.meta.glob<(this: Blockly.Block) => void>("./extensions/*.ts", {
	eager: true,
	import: "default",
});

const allBlocks = import.meta.glob<CustomBlock<never>>("./blocks/*.ts", {
	eager: true,
	import: "default",
});

/**
 * Blocks that are ignored by the TypeScript generator.
 * These are blocks that are never part of the generated
 * code, as they are inside the mutator of another block.
 *
 * (except for the spritePanel block, which is a special case)
 */
const mutatorBlocks = ["spritePanel"];
for (const filename in allBlocks) {
	const {name} = path.parse(filename);
	const customBlock = allBlocks[filename];

	mutatorBlocks.push(...(customBlock.mutatorBlocks ?? []));
	customBlock.register(name);
}

for (const filename in allExtensions) {
	const {name} = path.parse(filename);
	Blockly.Extensions.register(name, allExtensions[filename]);
}

/**
 * All names of properties and methods that are available on the sprite and stage objects.
 */
export const entityProperties = jsonBlocks.map(data => {
	// Despite the name, this also handles the dynamic code generation.
	// It's placed here to minimize the amount of iterations.
	if (!BlocksToCode.isRegistered(data.type) && !mutatorBlocks.includes(data.type)) {
		const isEvent = !("output" in data) && !("previousStatement" in data);

		BlocksToCode.register(data.type, (block, ts) => {
			let code = `self.${data.type}`;

			if (data.args0 || isEvent) {
				const args = (data.args0 || [])
					.filter(input => input.type === "input_value")
					.map(input => ts.valueToCode(block, input.name, Order.NONE) || "null");

				if (isEvent) {
					const next = block.getNextBlock();
					let arg = "() => {";

					if (next) {
						arg += "\n";
						arg += ts.prefixLines(ts.blockToCode(next) as string, "\t");
					}

					args.push(`${arg}}`);
				}

				// add arguments
				code += `(${args.join(", ")})`;
			}

			if (block.outputConnection) {
				return [code, Order.FUNCTION_CALL];
			}

			return `${code};\n`;
		});

		return data.type;
	}
});

Blockly.setLocale(En as unknown as Record<string, string>);
Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;
Blockly.defineBlocksWithJsonArray(jsonBlocks);

export {default as spriteToolbox} from "./data/sprite-toolbox.json";
export {default as stageToolbox} from "./data/stage-toolbox.json";
export {default as theme} from "./data/theme.json";
export {Blockly};
