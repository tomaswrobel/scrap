import * as Blockly from "blockly";
import * as blocks from "./blocks/*.ts";
import * as fields from "./fields/*.ts";
import * as extensions from "./extensions/*.ts";

import "@blockly/field-color";
import "@blockly/field-date";
import * as En from "blockly/msg/en";

import plugins from "./plugins";
import sprite from "./data/sprite.json";
import stage from "./data/stage.json";
import theme from "./data/theme.json";
import data from "./data/blocks.json";
import {TypeScript, Order} from "../code/transformers/typescript";

/**
 * Blocks that are ignored by the TypeScript generator.
 * These are blocks that are never part of the generated 
 * code, as they are inside the mutator of another block.
 * 
 * (except for the spritePanel block, which is a special case)
 */
const mutatorBlocks = ["spritePanel"]; {
	for (const name in blocks) {
		const data = blocks[name];

		if (name === "*.d") {
			continue;
		}

		if (data.blocks) {
			mutatorBlocks.push(...data.blocks);
		}

		if ("init" in data.MIXIN) {
			Blockly.Blocks[name] = data.MIXIN;
		} else {
			Blockly.Extensions.registerMutator(
				name,
				data.MIXIN,
				undefined,
				data.blocks
			);
		}
	}
}

for (const name in fields) {
	if (name === "*.d") {
		continue;
	}

	Blockly.fieldRegistry.register(
		name,
		fields[name].default
	);
}

for (const name in extensions) {
	if (name === "*.d") {
		continue;
	}

	Blockly.Extensions.register(
		name,
		extensions[name].default
	);
}

Blockly.setLocale(En);

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
				const args = (d.args0 || []).filter(input => input.type === "input_value").map(input => {
					return (
						ts.valueToCode(block, input.name, Order.NONE) ||
						"null"
					);
				});

				if (isEvent) {
					const next = block.getNextBlock();
					let arg = "() => {";

					if (next) {
						arg += "\n" + ts.prefixLines(
							ts.blockToCode(next) as string,
							"\t"
						);
					}

					args.push(arg + "}");
				}

				// add arguments
				code += `(${args.join(", ")})`;
			}

			if (block.outputConnection) {
				return [code, Order.FUNCTION_CALL];
			}

			return code + ";\n";
		});

		return d.type;
	}
});


// Just to make it look better
Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;

Blockly.defineBlocksWithJsonArray(data);

export {sprite, stage, theme, plugins};
export * from "./types";

console.log(mutatorBlocks);