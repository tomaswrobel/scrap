import BlocksToCode from "@scrap/code-transformers/blocksToCode";
import type {BlockDefinition} from "./category";
import {Order} from "@scrap/types/Order";

export function registerBlock(data: BlockDefinition) {
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
					arg += ts.prefixLines(String(ts.blockToCode(next)), "\t");
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
}
