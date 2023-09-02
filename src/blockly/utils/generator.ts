import {javascriptGenerator, Order} from "blockly/javascript";
import type {Entity} from "../../components/entities";
import * as Blockly from "blockly/core";
import type {CallBlock} from "../mutators/mutator_call";
import type {ArrayBlock} from "../mutators/mutator_array";
import type ProcedureBlock from "./procedure_block";
import type {TryBlock} from "../mutators/mutator_try";

const JavaScript = javascriptGenerator.constructor as typeof Blockly.Generator;

class Generator extends JavaScript {
	// Block settings
	static blocks = javascriptGenerator.forBlock;
	constructor(public entity?: Entity, protected useBlobURLs = true) {
		/*
		 * Scrap Script is a JavaScript subset which cannot work in the browser.
		 * This generator generates both valid JavaScript and ScrapScript.
		 */
		super("ScrapScript");
		this.addReservedWords("Scrap,Color");
		this.INDENT = entity ? "" : "\t";
		this.forBlock = Generator.blocks;
	}
	public scrub_(block: Blockly.Block, code: string, thisOnly?: boolean) {
		return super.scrub_(block, code, thisOnly || !block.previousConnection);
	}
	public get names() {
		return this.nameDB_!;
	}
	public setDefinition(name: string, definition: string) {
		this.definitions_[name] = definition;
	}
	get protection() {
		if (!this.entity) {
			return "";
		}
		return "\n\tawait new Promise(setTimeout)";
	}
	finish(result: string) {
		if (!this.entity) {
			return super.finish(result);
		}

		const isStage = this.entity.name === "Stage";
		const functions: string[] = [];
		const others: string[] = [];

		for (const key in this.definitions_) {
			if (key.startsWith("%")) {
				functions.push(this.definitions_[key]);
			} else {
				others.push(this.definitions_[key]);
			}
		}

		var code = others.join("\n\n") + "\n\n\n";

		code += `const ${this.entity.name} = new Scrap.${isStage ? "Stage" : "Sprite"}`;
		code += `(${this.getURLsFor(this.entity.costumes)},${this.getURLsFor(this.entity.sounds)});\n`;

		if (!isStage) {
			code += `${this.entity.name}.addTo(Stage);\n`;
		}

		if (result || functions.length) {
			code += this.entity.name + ".whenLoaded(async function () {\n";
			code += this.prefixLines(functions.join("\n\n"), this.INDENT);
			code += "\n\n";
			code += this.prefixLines(result, this.INDENT);
			code += "});\n";
		}

		this.definitions_ = Object.create(null);
		this.functionNames_ = Object.create(null);

		return code;
	}
	getURLsFor(files: File[]) {
		if (this.useBlobURLs) {
			return JSON.stringify(
				files.reduce(
					(urls, s) => ({
						...urls,
						[s.name]: URL.createObjectURL(s),
					}),
					{} as Record<string, string>
				),
				null,
				"\t"
			);
		} else {
			return JSON.stringify(
				files.reduce(
					(urls, s) => ({
						...urls,
						[s.name]: `${this.entity!.name}/${s.name}`,
					}),
					{} as Record<string, string>
				),
				null,
				"\t"
			);
		}
	}
}

declare namespace Generator {
	interface BlockGenerator<T extends Blockly.Block> {
		(block: T, generator: Generator): [string, Order] | string | null;
	}

	type Blocks = {
		[key: string]: BlockGenerator<Blockly.Block>;
	};
}

Generator.blocks.color = function (block: Blockly.Block) {
	return [`Color.fromHex("${block.getFieldValue("COLOR")}")`, Order.ATOMIC];
};

Generator.blocks.iterables_string = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("TEXT")), Order.ATOMIC];
};

Generator.blocks.effect = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("EFFECT")), Order.ATOMIC];
};

Generator.blocks.key = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("KEY")), Order.ATOMIC];
};

Generator.blocks.costume = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("NAME")), Order.ATOMIC];
};

Generator.blocks.switchBackdropTo = function (block: Blockly.Block, generator: Generator) {
	const backdrop = generator.valueToCode(block, "COSTUME", Order.MEMBER) || "null";
	return `this.switchBackdropTo(${backdrop});\n`;
};

Generator.blocks.nextBackdrop = function () {
	return "this.nextBackdrop();\n";
};

Generator.blocks.repeat = function (block: Blockly.Block, generator: Generator) {
	const times = generator.valueToCode(block, "TIMES", Order.NONE) || "0";
	const i = Blockly.Variables.generateUniqueName(block.workspace);
	return `for (let ${i} = 0; ${i} < ${times}; ${i}++) {${generator.protection}\n${generator.statementToCode(
		block,
		"STACK"
	)}}\n`;
};

Generator.blocks.while = function (block: Blockly.Block, generator: Generator) {
	const condition = generator.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `while (${condition}) {${generator.protection}\n${generator.statementToCode(block, "STACK")}}\n`;
};

Generator.blocks.getEffect = function (block: Blockly.Block, generator: Generator) {
	const effect = generator.valueToCode(block, "EFFECT", Order.NONE) || "null";
	return [`this.effects[${effect}]`, Order.MEMBER];
};

Generator.blocks.break = function () {
	return "break;\n";
};

Generator.blocks.continue = function () {
	return "continue;\n";
};

Generator.blocks.sprite = function (block: Blockly.Block) {
	return [block.getFieldValue("SPRITE"), Order.ATOMIC];
};

Generator.blocks.parameter = function (block: Blockly.Block) {
	return [block.getField("VAR")!.getText(), Order.ATOMIC];
};

Generator.blocks.tryCatch = function (block: TryBlock, generator: Generator) {
	let code = "try {\n";
	code += generator.statementToCode(block, "TRY");

	if (block.catch) {
		if (typeof block.catch === "string") {
			code += `} catch (${block.catch}) {\n`;
		} else {
			code += "} catch {\n";
		}
		code += generator.statementToCode(block, "CATCH");
	}

	if (block.finally) {
		code += "} finally {\n";
		code += generator.statementToCode(block, "FINALLY");
	}

	return code + "}\n";
};

Generator.blocks.throw = function (block: Blockly.Block, generator: Generator) {
	const error = generator.valueToCode(block, "ERROR", Order.NONE) || "null";
	return `throw ${error};\n`;
};

Generator.blocks.foreach = function (block: Blockly.Block, generator: Generator) {
	const item = block.getField("VAR")!.getText();
	const iterable = generator.valueToCode(block, "ITERABLE", Order.NONE) || "[]";
	return `for ${generator.entity ? "await " : ""}(const ${item} of ${iterable}) {${
		generator.protection
	}\n${generator.statementToCode(block, "DO")}}\n`;
};

Generator.blocks.property = function (block: Blockly.Block, generator: Generator) {
	return [`${generator.valueToCode(block, "SPRITE", Order.MEMBER)}.${block.getFieldValue("PROPERTY")}`, Order.MEMBER];
};

Generator.blocks.array = function (block: ArrayBlock, generator: Generator) {
	const items: string[] = [];
	for (let i = 0; i < block.items.length; i++) {
		const item = block.items[i];
		if (item === "iterable") {
			items.push(`...${generator.valueToCode(block, `ADD${i}`, Order.NONE) || "[]"}`);
		} else {
			items.push(generator.valueToCode(block, `ADD${i}`, Order.NONE) || "null");
		}
	}
	return [`[${items.join(", ")}]`, Order.ATOMIC];
};

Generator.blocks.length = function (block: Blockly.Block, generator: Generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.length`, Order.MEMBER];
};

Generator.blocks.reverse = function (block: Blockly.Block, generator: Generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.reverse()`, Order.MEMBER];
};

Generator.blocks.includes = function (block: Blockly.Block, generator: Generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = generator.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.includes(${item})`, Order.MEMBER];
};

Generator.blocks.indexOf = function (block: Blockly.Block, generator: Generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = generator.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.indexOf(${item})`, Order.MEMBER];
};

Generator.blocks.string = function (block: Blockly.Block, generator: Generator) {
	return [`String(${generator.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
};

Generator.blocks.function = function (block: ProcedureBlock, generator: Generator) {
	const name = generator.names.getName(block.getFieldValue("NAME"), Blockly.Names.NameType.PROCEDURE);
	const type = block.getFieldValue("TYPE");
	const comment = block.getCommentText();
	const nextBlock = block.getNextBlock();

	const params: string[] = [];
	let code = "/**\n";

	if (comment) {
		code += generator.prefixLines(comment, " * ") + "\n";
	}

	for (const param of block.params) {
		params.push(param.name);
		code += ` * @param {${param.type || "*"}} ${param.name}\n`;
	}

	if (block.isGenerator) {
		code += " */\n";
	} else {
		code += ` * @returns {${type || "void"}}\n */\n`;
	}

	if (generator.entity) {
		code += "async ";
	}

	code += `${block.getFieldValue("label")} ${name}(${params.join(", ")}) {\n`;

	if (nextBlock) {
		code += generator.prefixLines(generator.blockToCode(nextBlock) as string, generator.INDENT);
	}

	generator.setDefinition("%" + name, code + "}\n");
	return null;
};

Generator.blocks.motion_angle = function (block: Blockly.Block) {
	return [block.getFieldValue("VALUE"), Order.ATOMIC];
};

Generator.blocks.call = function (block: CallBlock, generator: Generator) {
	let code = generator.names.getName(block.getFieldValue("NAME"), Blockly.Names.NameType.PROCEDURE);
	const args = block.params_.map((_, i) => generator.valueToCode(block, "PARAM_" + i, Order.NONE) || "null");
	if (generator.entity) {
		args.unshift("this");
		code = `await ${code}.call`;
	}
	code += `(${args.join(", ")})`;
	if (block.outputConnection) {
		return [code, Order.FUNCTION_CALL];
	} else {
		return code + ";\n";
	}
};

Generator.blocks.return = function (block: Blockly.Block, generator: Generator) {
	const hasInput = !!block.getInput("VALUE");

	if (hasInput) {
		return `return ${generator.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
	} else {
		return "return;\n";
	}
};

Generator.blocks.yield = function (block: Blockly.Block, generator: Generator) {
	return `yield ${generator.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
};

Generator.blocks.arithmetics = function (block: Blockly.Block, generator: Generator) {
	const operator = block.getFieldValue("OP");

	let order: Order;

	switch (operator) {
		case "**":
			order = Order.EXPONENTIATION;
			break;
		case "+":
		case "-":
			order = Order.ADDITION;
			break;
		case "*":
		case "/":
		case "%":
			order = Order.MULTIPLICATION;
			break;
		default:
			order = Order.NONE;
			break;
	}

	const left = generator.valueToCode(block, "A", order) || "0";
	const right = generator.valueToCode(block, "B", order) || "0";

	return [`${left} ${operator} ${right}`, order];
};

Generator.blocks.compare = function (block: Blockly.Block, generator: Generator) {
	const operator = block.getFieldValue("OP");

	let order: Order;

	switch (operator) {
		case "==":
		case "!=":
			order = Order.EQUALITY;
			break;
		case ">":
		case "<":
		case ">=":
		case "<=":
			order = Order.RELATIONAL;
			break;
		default:
			order = Order.NONE;
			break;
	}

	const left = generator.valueToCode(block, "A", order) || "0";
	const right = generator.valueToCode(block, "B", order) || "0";

	return [`${left} ${operator} ${right}`, order];
};

Generator.blocks.boolean = function (block: Blockly.Block) {
	return [block.getFieldValue("BOOL"), Order.ATOMIC];
};

Generator.blocks.math_number = function (block: Blockly.Block) {
	return [block.getFieldValue("NUM"), Order.ATOMIC];
};

Generator.blocks.operation = function (block: Blockly.Block, generator: Generator) {
	const operator = block.getFieldValue("OP");

	let order: Order;

	switch (operator) {
		case "&&":
			order = Order.LOGICAL_AND;
			break;
		case "||":
			order = Order.LOGICAL_OR;
			break;
		default:
			order = Order.NONE;
			break;
	}

	const left = generator.valueToCode(block, "A", order) || "false";
	const right = generator.valueToCode(block, "B", order) || "false";

	return [`${left} ${operator} ${right}`, order];
};

Generator.blocks.logic_negate = function (block: Blockly.Block, generator: Generator) {
	return [generator.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false", Order.LOGICAL_NOT];
};

Generator.blocks.random = function () {
	return ["Math.random()", Order.FUNCTION_CALL];
};

Generator.blocks.item = function (block: Blockly.Block, generator: Generator) {
	const index = generator.valueToCode(block, "INDEX", Order.NONE) || "0";
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}[${index}]`, Order.MEMBER];
};

Generator.blocks.rgb = function (block: Blockly.Block, generator: Generator) {
	const r = generator.valueToCode(block, "RED", Order.NONE) || "0";
	const g = generator.valueToCode(block, "GREEN", Order.NONE) || "0";
	const b = generator.valueToCode(block, "BLUE", Order.NONE) || "0";

	return [`Color.fromRGB(${r}, ${g}, ${b})`, Order.FUNCTION_CALL];
};

export {Order, Generator};
