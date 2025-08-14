/**
 * This file is a part of Scrap Native, an app for helping to migrate
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
import {TypeScript} from "@scrap/code-transformers/blocksToCode";
import * as Blockly from "blockly/core";

import data from "./data/blocks.json";
import sprite from "./data/sprite.json";
import stage from "./data/stage.json";
import theme from "./data/theme.json";
import allBlocks from "./lib/blocks";
import extensions from "./lib/extensions";
import fields from "./lib/fields";
import * as plugins from "./lib/plugins";
import * as En from "blockly/msg/en";

import "@blockly/field-date";
import {Order} from "blockly/javascript";
import * as path from "path";

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
	const {blocks = [], MIXIN} = allBlocks[filename];

	mutatorBlocks.push(...blocks);

	if ("init" in MIXIN) {
		Blockly.Blocks[name] = MIXIN;
	} else {
		Blockly.Extensions.registerMutator(name, MIXIN, undefined, blocks);
	}
}

for (const filename in fields) {
	const {name} = path.parse(filename);
	Blockly.fieldRegistry.register(name, fields[filename]);
}

for (const filename in extensions) {
	const {name} = path.parse(filename);
	Blockly.Extensions.register(name, extensions[filename]);
}

/**
 * All names of properties and methods that are available on the sprite and stage objects.
 */
export const properties = data.map(d => {
	// Despite the name, this also handles the dynamic code generation.
	// It's placed here to minimize the amount of iterations.

	if (!(d.type in TypeScript.blocks) && mutatorBlocks.indexOf(d.type) === -1) {
		const isEvent = !("output" in d) && !("previousStatement" in d);

		TypeScript.register(d.type, (block, ts) => {
			let code = `self.${d.type}`;

			if (d.args0 || isEvent) {
				const args = (d.args0 || [])
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

		return d.type;
	}
});

Blockly.setLocale(En as unknown as Record<string, string>);
Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;
Blockly.defineBlocksWithJsonArray(data);

export * from "./types";
export {plugins, sprite, stage, theme};
