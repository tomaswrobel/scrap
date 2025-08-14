/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Scrap's code generator.
 * @copyright Tomáš Wróbel 2025
 *
 * Inspired by Blockly's JavaScript generator.
 * Where noted, some parts are directly copied
 * from Blockly's JavaScript generator.
 */
import * as Blockly from "blockly/core";
import type {Entity} from "../entity";

import type JSZip from "jszip";
import {Order, reservedWords} from "./utils";
import * as SWC from "@scrap/utils/swc";

import type {FunctionBlock} from "../blockly/blocks/function";
import type {ParameterBlock} from "../blockly/blocks/parameter";
import type {TryBlock} from "../blockly/blocks/try";
import type {ArrayBlock} from "../blockly/blocks/array";
import type {UnknownBlock} from "../blockly/blocks/unknown";
import type {CallBlock} from "../blockly/blocks/call";
import type {UnionBlock} from "../blockly/blocks/union";

interface BlockCallback<T extends Blockly.Block> {
	(block: T, ts: BlocksToCode): null | string | [string, Order];
}

/**
 * This generator generates ScrapScript, a
 * TypeScript subset. ScrapScript is used
 * to interact with Scrap. It looks like
 * runnable JavaScript, but it is not.
 *
 * 1. ScrapScript must get rid of types.
 * 2. Must go through process in {@link transform javascript.ts}
 * 3. The code gets warped in a code like:
 * ```js
 * var $ = {};
 *
 * $["Sprite"] = new Sprite({
 *         //...
 * });
 *
 * $["Sprite"].init(async self => {
 *         // HERE is the code
 * });
 * ```
 */
class BlocksToCode extends Blockly.CodeGenerator {
	public static blocks: Record<string, BlockCallback<Blockly.Block>> = {};

	// Directly copied from Blockly's JavaScript generator.
	public override ORDER_OVERRIDES = [
		// (foo()).bar -> foo().bar
		// (foo())[0] -> foo()[0]
		[Order.FUNCTION_CALL, Order.MEMBER],
		// (foo())() -> foo()()
		[Order.FUNCTION_CALL, Order.FUNCTION_CALL],
		// (foo.bar).baz -> foo.bar.baz
		// (foo.bar)[0] -> foo.bar[0]
		// (foo[0]).bar -> foo[0].bar
		// (foo[0])[1] -> foo[0][1]
		[Order.MEMBER, Order.MEMBER],
		// (foo.bar)() -> foo.bar()
		// (foo[0])() -> foo[0]()
		[Order.MEMBER, Order.FUNCTION_CALL],

		// !(!foo) -> !!foo
		[Order.LOGICAL_NOT, Order.LOGICAL_NOT],
		// a * (b * c) -> a * b * c
		[Order.MULTIPLICATION, Order.MULTIPLICATION],
		// a + (b + c) -> a + b + c
		[Order.ADDITION, Order.ADDITION],
		// a && (b && c) -> a && b && c
		[Order.LOGICAL_AND, Order.LOGICAL_AND],
		// a || (b || c) -> a || b || c
		[Order.LOGICAL_OR, Order.LOGICAL_OR],
	];

	constructor(public readonly entity: Entity) {
		// "ScrapScript" is a TypeScript subset.
		// It supports ES2015 features

		super("ScrapScript");
		this.isInitialized = false;
		this.addReservedWords(`${reservedWords}`);

		this.forBlock = BlocksToCode.blocks;
		this.INDENT = "\t";
	}

	public override init(workspace: Blockly.Workspace) {
		super.init(workspace);
		const vars = this.entity.variables.map(
			([name, type]) => `\t${JSON.stringify(name)}: ${typeof type === "string" ? type : type.join(" | ")};\n`
		);

		if (vars.length > 0) {
			this.definitions_.variables = `interface Variables {\n${vars.join("")}}`;
		}

		this.isInitialized = true;
	}

	public override scrub_(block: Blockly.Block, code: string, thisOnly?: boolean): string {
		let commentCode = "";

		// Only collect comments for blocks that aren't inline.
		if (!block.outputConnection || !block.outputConnection.targetConnection) {
			// Collect comment for this block.
			const comment = block.getCommentText();
			if (comment) {
				commentCode += this.prefixLines(Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3), "// ");
				commentCode += "\n";
			}
			// Collect comments for all value arguments.
			// Don't collect comments for nested statements.
			for (let i = 0; i < block.inputList.length; i++) {
				if (block.inputList[i].type === Blockly.inputs.inputTypes.VALUE) {
					const childBlock = block.inputList[i].connection?.targetBlock();
					if (childBlock) {
						const comment = this.allNestedComments(childBlock);
						if (comment) {
							commentCode += this.prefixLines(comment, "// ");
							commentCode += "\n";
						}
					}
				}
			}
		}

		return (
			commentCode +
			code +
			(thisOnly || !block.previousConnection
				? ""
				: this.blockToCode(block.nextConnection && block.nextConnection.targetBlock()))
		);
	}

	public override finish(result: string) {
		const definitions = Object.values(this.definitions_).join("\n\n");
		this.isInitialized = false;
		this.nameDB_?.reset();

		return `${definitions}${definitions && "\n\n"}${super.finish(result)}`;
	}

	public override scrubNakedValue(line: string) {
		return `${line};`;
	}

	public async ready(zip?: JSZip) {
		const code = this.entity.code;
		const result = await SWC.transform(
			typeof code === "string" ? code : this.workspaceToCode(this.entity.workspace)
		);
		const body = this.prefixLines(result, "\t");
		const isStage = this.entity.isStage();
		const configuration = {
			...this.entity.init,
			current: this.entity.current,
			images: this.entity.getURLs("costumes", zip),
			sounds: this.entity.getURLs("sounds", zip),
		};
		const entity = `$[${JSON.stringify(this.entity.name)}]`;
		const init = `${entity} = new Scrap.${isStage ? "Stage" : "Sprite"}(${JSON.stringify(
			configuration,
			null,
			"\t"
		)});`;
		return `${init}\n${entity}.init(async self => {\n${body}});\n${isStage ? "" : `${entity}.addTo($["Stage"])`}\n`;
	}

	public static register<Block extends Blockly.Block>(...args: [...string[], BlockCallback<Block>]) {
		const callback = args.pop() as BlockCallback<Blockly.Block>;

		for (const type of args) {
			this.blocks[type as string] = callback;
		}
	}

	public set(name: string, value: string) {
		this.definitions_[`%${name}`] = value;
	}
}

BlocksToCode.register("ternary", (block, ts) => {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	const then = ts.valueToCode(block, "THEN", Order.NONE) || "null";
	const otherwise = ts.valueToCode(block, "ELSE", Order.NONE) || "null";
	return [`${condition} ? ${then} : ${otherwise}`, Order.CONDITIONAL];
});

BlocksToCode.register<UnknownBlock>("unknown", block => {
	if (block.shape === "reporter") {
		return [`/* this.${block.opcode}() */`, Order.ATOMIC];
	}
	return `/* this.${block.opcode}(); */\n`;
});

BlocksToCode.register("set", (block, ts) => {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} = ${value || "null"};\n`;
});

BlocksToCode.register("change", (block, ts) => {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} += ${value || "null"};\n`;
});

BlocksToCode.register("variable", (block, ts) => {
	const VAR = ts.valueToCode(block, "VAR", Order.NONE);
	const VALUE = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${block.getFieldValue("kind")} ${VAR} = ${VALUE || "null"};\n`;
});

BlocksToCode.register("showVariable", block => {
	return `self.showVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

BlocksToCode.register("hideVariable", block => {
	return `self.hideVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

BlocksToCode.register("iterables_string", block => {
	return [JSON.stringify(block.getFieldValue("TEXT")), Order.ATOMIC];
});

BlocksToCode.register("rotationStyle", block => {
	return [JSON.stringify(block.getFieldValue("STYLE")), Order.ATOMIC];
});

BlocksToCode.register("key", block => {
	return [JSON.stringify(block.getFieldValue("KEY")), Order.ATOMIC];
});

BlocksToCode.register("effect", block => {
	return [`self.effects.${block.getFieldValue("EFFECT")}`, Order.MEMBER];
});

BlocksToCode.register("sound", "costume_menu", "backdrop_menu", block => {
	return [JSON.stringify(block.getFieldValue("NAME")), Order.ATOMIC];
});

BlocksToCode.register("backdrop", "costume", block => {
	return [`self.${block.type}.${block.getFieldValue("VALUE")}`, Order.MEMBER];
});

BlocksToCode.register("for", (block, ts) => {
	const variable = block.getField("VAR")!.getText();
	const from = ts.valueToCode(block, "FROM", Order.NONE) || "0";
	const to = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {\n${ts.statementToCode(
		block,
		"STACK"
	)}}\n`;
});

BlocksToCode.register("while", (block, ts) => {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `while (${condition}) {\n${ts.statementToCode(block, "STACK")}}\n`;
});

BlocksToCode.register("doWhile", (block, ts) => {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `do {\n${ts.statementToCode(block, "STACK")}} while (${condition});\n`;
});

BlocksToCode.register("break", "continue", block => {
	return `${block.type};\n`;
});

BlocksToCode.register("sprite", block => {
	const name = block.getFieldValue("SPRITE");
	if (name === "self") {
		return [name, Order.ATOMIC];
	}
	return [`$[${JSON.stringify(name)}]`, Order.MEMBER];
});

BlocksToCode.register("clone", (block, ts) => {
	return `${ts.valueToCode(block, "SPRITE", Order.MEMBER)}.clone();\n`;
});

BlocksToCode.register<ParameterBlock>("parameter", block => {
	if (block.isVariable_) {
		return [`self.variables[${JSON.stringify(block.getFieldValue("VAR"))}]`, Order.MEMBER];
	}
	return [block.getFieldValue("VAR"), Order.ATOMIC];
});

BlocksToCode.register("event", block => {
	return [JSON.stringify(block.getFieldValue("EVENT")), Order.ATOMIC];
});

BlocksToCode.register<TryBlock>("tryCatch", (block, ts) => {
	let code = "try {\n";
	code += ts.statementToCode(block, "TRY");

	if (block.catch) {
		if (typeof block.catch === "string") {
			code += `} catch (${block.catch}) {\n`;
		} else {
			code += "} catch {\n";
		}
		code += ts.statementToCode(block, "CATCH");
	}

	if (block.finally) {
		code += "} finally {\n";
		code += ts.statementToCode(block, "FINALLY");
	}

	return `${code}}\n`;
});

BlocksToCode.register("throw", (block, ts) => {
	const error = ts.valueToCode(block, "ERROR", Order.NONE) || "null";
	return `throw ${error};\n`;
});

BlocksToCode.blocks.stop = function () {
	return "Scrap.stop();\n";
};

BlocksToCode.register("controls_if", (block, ts) => {
	// If/elseif/else condition.
	let code = "";

	for (let i = 0; block.getInput(`IF${i}`); i++) {
		const conditionCode = ts.valueToCode(block, `IF${i}`, Order.NONE) || "false";
		const branchCode = ts.statementToCode(block, `DO${i}`);
		code += `${i ? " else " : ""}if (${conditionCode}) {\n${branchCode}}`;
	}

	if (block.getInput("ELSE")) {
		code += ` else {\n${ts.statementToCode(block, "ELSE")}}`;
	}
	return `${code}\n`;
});

BlocksToCode.register("foreach", (block, ts) => {
	const item = block.getFieldValue("VAR");
	const iterable = ts.valueToCode(block, "ITERABLE", Order.NONE) || "[]";
	return `for (const ${item} of ${iterable}) {\n${ts.statementToCode(block, "DO")}}\n`;
});

BlocksToCode.register("property", block => {
	return [`$[${JSON.stringify(block.getFieldValue("SPRITE"))}].${block.getFieldValue("PROPERTY")}`, Order.MEMBER];
});

BlocksToCode.blocks.isTurbo = function () {
	return ["Scrap.isTurbo", Order.MEMBER];
};

BlocksToCode.register("array", (block: ArrayBlock, ts) => {
	const type = ts.valueToCode(block, "TYPE", Order.NONE) || "any";
	const items: string[] = [];

	for (let i = 0; i < block.items.length; i++) {
		const item = block.items[i];
		if (item === "iterable") {
			items.push(`...${ts.valueToCode(block, `ADD${i}`, Order.NONE) || "[]"}`);
		} else {
			items.push(ts.valueToCode(block, `ADD${i}`, Order.NONE) || "null");
		}
	}
	return [`new Array${type === "any" ? "" : `<${type}>`}(${items.join(", ")})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("length", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.length`, Order.MEMBER];
});

BlocksToCode.register("reverse", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.reverse()`, Order.MEMBER];
});

BlocksToCode.register("join", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const separator = ts.valueToCode(block, "SEPARATOR", Order.NONE) || '""';
	return [`${array}.join(${separator})`, Order.MEMBER];
});

BlocksToCode.register("includes", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.includes(${item})`, Order.MEMBER];
});

BlocksToCode.register("slice", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const start = ts.valueToCode(block, "START", Order.NONE) || "0";
	const end = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return [`${array}.slice(${start}, ${end})`, Order.MEMBER];
});

BlocksToCode.register("indexOf", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.indexOf(${item})`, Order.MEMBER];
});

BlocksToCode.register("string", (block, ts) => {
	return [`String(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("number", (block, ts) => {
	return [`Number(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("function", (block: FunctionBlock, ts) => {
	const params = new Array<string>(block.params.length);
	const nextBlock = block.getNextBlock();
	const name = block.getFieldValue("NAME");
	const returns = block.returns ? ts.valueToCode(block, "RETURNS", Order.NONE) : "void";
	for (let i = 0; i < params.length; i++) {
		params[i] = ts.valueToCode(block, `PARAM_${i}`, Order.NONE);
	}

	if (nextBlock) {
		var body = ts.prefixLines(ts.blockToCode(nextBlock) as string, ts.INDENT);
	} else {
		var body = "\t\n";
	}

	ts.set(name, `function ${name}(${params.join(", ")}): ${returns} {\n${body}}`);
	return null;
});

BlocksToCode.register("generic", (block, ts) => {
	return [`${block.getFieldValue("ITERABLE")}<${ts.valueToCode(block, "TYPE", Order.NONE) || "any"}>`, 0];
});

BlocksToCode.register<UnionBlock>("union", (block, ts) => {
	const count = block.count;
	const types = [] as string[];

	for (let i = 0; i < count; i++) {
		types.push(ts.valueToCode(block, `TYPE${i}`, Order.NONE));
	}

	return [types.join(" | "), Order.ATOMIC];
});

BlocksToCode.register("type", block => {
	return [block.getFieldValue("TYPE"), Order.ATOMIC];
});

BlocksToCode.register("typed", (block, ts) => {
	return [
		`${block.getField("PARAM")!.getText()}: ${ts.valueToCode(block, "TYPE", Order.ATOMIC) || "any"}`,
		Order.NONE,
	];
});

BlocksToCode.register("motion_angle", block => {
	return [block.getFieldValue("VALUE"), Order.ATOMIC];
});

BlocksToCode.register("text_or_number", block => {
	const value = block.getFieldValue("VALUE");

	if (value === "") {
		return ['""', Order.ATOMIC];
	}

	if (!isNaN(Number(value))) {
		return [value, Order.ATOMIC];
	}

	return [JSON.stringify(value), Order.ATOMIC];
});

BlocksToCode.register("call", (block: CallBlock, ts) => {
	const args = block.params_.map((_, i) => ts.valueToCode(block, `PARAM_${i}`, Order.NONE) || "null");
	const code = `${block.getFieldValue("NAME")}(${args.join(", ")})`;

	if (block.outputConnection) {
		return [code, Order.FUNCTION_CALL];
	} else {
		return `${code};\n`;
	}
});

BlocksToCode.register("return", (block, ts) => {
	const hasInput = !!block.getInput("VALUE");

	if (hasInput) {
		return `return ${ts.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
	} else {
		return "return;\n";
	}
});

BlocksToCode.register("arithmetics", (block, ts) => {
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

	const left = ts.valueToCode(block, "A", order) || "0";
	const right = ts.valueToCode(block, "B", order) || "0";

	return [`${left} ${operator} ${right}`, order];
});

BlocksToCode.register("compare", (block, ts) => {
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

	const left = ts.valueToCode(block, "A", order) || "0";
	const right = ts.valueToCode(block, "B", order) || "0";

	return [`${left} ${operator} ${right}`, order];
});

BlocksToCode.register("not", (block, ts) => {
	return [`!${ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false"}`, Order.LOGICAL_NOT];
});

BlocksToCode.register("boolean", block => {
	return [block.getFieldValue("BOOL"), Order.ATOMIC];
});

BlocksToCode.register("math_number", block => {
	return [block.getFieldValue("NUM"), Order.ATOMIC];
});

BlocksToCode.register("math", (block, ts) => {
	const number = ts.valueToCode(block, "NUM", Order.NONE) || "0";
	return [`Math.${block.getFieldValue("OP")}(${number})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("constant", block => {
	return [block.getFieldValue("CONSTANT"), Order.ATOMIC];
});

BlocksToCode.register("operation", (block, ts) => {
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

	const left = ts.valueToCode(block, "A", order) || "false";
	const right = ts.valueToCode(block, "B", order) || "false";

	return [`${left} ${operator} ${right}`, order];
});

BlocksToCode.register("logic_negate", (block, ts) => {
	return [ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false", Order.LOGICAL_NOT];
});

BlocksToCode.blocks.random = function () {
	return ["Math.random()", Order.FUNCTION_CALL];
};

BlocksToCode.register("item", (block, ts) => {
	const index = ts.valueToCode(block, "INDEX", Order.NONE) || "0";
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}[${index}]`, Order.MEMBER];
});

BlocksToCode.register("rgb", (block, ts) => {
	const r = ts.valueToCode(block, "RED", Order.NONE) || "0";
	const g = ts.valueToCode(block, "GREEN", Order.NONE) || "0";
	const b = ts.valueToCode(block, "BLUE", Order.NONE) || "0";

	return [`Color.fromRGB(${r}, ${g}, ${b})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("color", block => {
	return [`Color.fromHex("${block.getFieldValue("COLOR")}")`, Order.ATOMIC];
});

BlocksToCode.blocks.color_random = function () {
	return ["Color.random()", Order.FUNCTION_CALL];
};

BlocksToCode.register("date", block => {
	return [`new Date("${block.getFieldValue("DATE")}")`, Order.FUNCTION_CALL];
});

BlocksToCode.blocks.today = function () {
	return ["new Date()", Order.FUNCTION_CALL];
};

BlocksToCode.register("dateProperty", (block, ts) => {
	return [`${ts.valueToCode(block, "DATE", Order.MEMBER)}.${block.getFieldValue("PROPERTY")}()`, Order.FUNCTION_CALL];
});

BlocksToCode.register("alert", (block, ts) => {
	return `window.alert(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'});\n`;
});

BlocksToCode.register("prompt", (block, ts) => {
	return [`window.prompt(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("confirm", (block, ts) => {
	return [`window.confirm(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`, Order.FUNCTION_CALL];
});

export {BlocksToCode as TypeScript};
