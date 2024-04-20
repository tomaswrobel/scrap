import * as Blockly from "blockly";
import blocks from "./blocks";
import fields from "./fields";
import extensions from "./extensions";

import "@blockly/field-color";
import "@blockly/field-date";
import * as En from "blockly/msg/en";

import plugins from "./plugins";
import sprite from "./data/sprite.json";
import stage from "./data/stage.json";
import theme from "./data/theme.json";
import data from "./data/blocks.json";
import {TypeScript, Order} from "../code/transformers/typescript";

for (const name in blocks) {
	const data = blocks[name];

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

for (const field in fields) {
	Blockly.fieldRegistry.register(
		field,
		fields[field].default
	);
}

for (const extension in extensions) {
	Blockly.Extensions.register(
		extension,
		extensions[extension].default
	);
}

Blockly.setLocale(En);

export const allBlocks = data.map(({args0, type, output, previousStatement}) => {
	const isEvent = output === undefined && previousStatement === undefined;

	if (!(type in TypeScript.blocks)) {
		TypeScript.register(type, (block, ts) => {
			let code = `self.${type}`;

			if (args0 || isEvent) {
				const args = (args0 || []).map(input => {
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
							ts.INDENT
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
	}

	return type;
});


// Just to make it look better
Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;

Blockly.defineBlocksWithJsonArray(data);

export {sprite, stage, theme, plugins};
export * from "./types";