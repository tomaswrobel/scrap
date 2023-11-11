import * as Blockly from "blockly/core";

export const Types = ["", "Number", "String", "Boolean", "Color", "Array", "Sprite", "Date"];
export const Error = `Type must be one of void${Types.join(", ")}`;

export const TypeToShadow: Record<string, string> = {
	Number: "math_number",
	String: "iterables_string",
	Color: "color",
	Sprite: "sprite",
	Date: "date"
};

Blockly.defineBlocksWithJsonArray(
	Types.map((type, i) => ({
		type: "function_param_" + type,
		message0: `${type}${type && " "}parameter %1`,
		args0: [
			{
				type: "field_input",
				name: "NAME",
				text: `param${i + 1}`,
			},
		],
		style: "procedure_blocks",
		nextStatement: null,
		previousStatement: null,
	}))
);

Blockly.Extensions.register("getVar", function (this: Blockly.Block) {
	this.getField("VAR")!.setValidator(name => {
		for (const [variable, type] of window.app.current.variables) {
			if (variable === name) {
				this.setOutput(true, type || null);
				return name;
			}
		}
		for (const [variable, type] of window.app.globalVariables) {
			if (variable === name) {
				this.setOutput(true, type || null);
				return name;
			}
		}
		return name;
	});
});

Blockly.Extensions.register("setVar", function (this: Blockly.Block) {
	const input = this.getInput("VALUE")!;
	const field = this.getField("VAR")!;

	const onChange = (name: string) => {
		const [, type] = window.app.current.variables.find(([e]) => e === name) || [];

		if (!type || !(type in TypeToShadow)) {
			return name;
		}

		const old = input.connection!.targetBlock();
		if (old) {
			if (old.isShadow()) {
				old.setShadow(false);
				old.dispose(false);
			} else {
				old.unplug();
			}
		}

		input.setCheck(type);

		const block = this.workspace.newBlock(TypeToShadow[type]);
		block.setShadow(true);
		
		if (block instanceof Blockly.BlockSvg) {
			block.initSvg();
			block.render();
		}

		input.connection!.connect(block.outputConnection!);

		return name;
	};

	field.setValidator(onChange);
});