/**
 * This file is a part of Scrap, an app for helping to migrate
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
import type ArrayBlock from "@scrap/blockly/blocks/array";
import type CallBlock from "@scrap/blockly/blocks/call";
import type FunctionBlock from "@scrap/blockly/blocks/function";
import type ParameterBlock from "@scrap/blockly/blocks/parameter";
import type TryBlock from "@scrap/blockly/blocks/try";
import type UnionBlock from "@scrap/blockly/blocks/union";
import type UnknownBlock from "@scrap/blockly/blocks/unknown";
import {Order} from "@scrap/types/Order";
import type {Variable} from "@scrap/types/Variable";
import type {CustomBlock} from "@scrap/utils/CustomBlock";
import {reservedWordsInJs} from "@scrap/utils/reservedWordsInJs";
import * as Blockly from "blockly/core";

type BlockCallback<T extends Blockly.Block> = (
	block: T,
	ts: BlocksToCode,
) => null | string | [string, Order];

/**
 * This generator generates ScrapScript, a
 * TypeScript subset. ScrapScript is used
 * to interact with Scrap. It looks like
 * runnable JavaScript, but it is not.
 *
 * 1. ScrapScript must get rid of types.
 * 2. Must go through process in SWC.transform
 * 3. The code gets warped in a code like:
 * ```js
 * var $ = {};
 *
 * $["Sprite"] = new Sprite({
 *   //...
 * });
 *
 * $["Sprite"].init(async self => {
 *   // HERE is the code
 * });
 * ```
 */
class BlocksToCode extends Blockly.CodeGenerator {
	private static blocks: Record<string, BlockCallback<Blockly.Block>> = {};
	public readonly variables: Variable[];

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

	constructor(variables: Variable[]) {
		super("ScrapScript");

		this.variables = variables;
		this.isInitialized = false;
		this.addReservedWords(`${reservedWordsInJs}`);

		this.forBlock = BlocksToCode.blocks;
	}

	public override init(workspace: Blockly.Workspace) {
		super.init(workspace);

		if (this.variables.length > 0) {
			this.definitions_.variables = this.variables.reduce(
				(a, [b, ...c]) => `${a}\t${JSON.stringify(b)}: ${c.flat().join(" | ")};\n`,
				"interface Variables {\n",
			);
			this.definitions_.variables += "}";
		}

		this.isInitialized = true;
	}

	public override scrub_(block: Blockly.Block, code: string, thisOnly?: boolean): string {
		let result = "";
		// Only collect comments for blocks that aren't inline.
		if (!block.outputConnection?.targetConnection) {
			// Collect comment for this block.
			const comment = block.getCommentText();

			if (comment) {
				result += this.prefixLines(
					Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3),
					"// ",
				);
				result += "\n";
			}

			// Collect comments for all value arguments.
			// Don't collect comments for nested statements.
			for (const input of block.inputList) {
				if (input.type === Blockly.inputs.inputTypes.VALUE) {
					const childBlock = input.connection?.targetBlock();
					if (childBlock) {
						const comment = this.allNestedComments(childBlock);
						if (comment) {
							result += this.prefixLines(comment, "// ");
							result += "\n";
						}
					}
				}
			}
		}

		result += code;

		if (!thisOnly && block.previousConnection) {
			result += this.blockToCode(block.nextConnection?.targetBlock() ?? null) as string;
		}

		return result;
	}

	public override finish(result: string) {
		const definitions = Object.values(this.definitions_).reduce(
			(a, b) => `${a}${b}\n\n`,
			"",
		);

		this.isInitialized = false;
		this.nameDB_?.reset();

		return definitions + super.finish(result);
	}

	public override scrubNakedValue(line: string) {
		return `${line};`;
	}

	public static register<T>(...args: [...string[], BlockCallback<CustomBlock.Infer<T>>]) {
		const callback = args.pop() as BlockCallback<Blockly.Block>;

		for (const type of args) {
			this.blocks[type as string] = callback;
		}
	}

	public static isRegistered(name: string) {
		return Object.hasOwn(this.blocks, name);
	}

	public define(name: string, value: string) {
		this.definitions_[`%${name}`] = value;
	}
}

BlocksToCode.register("ternary", function (block, ts) {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	const then = ts.valueToCode(block, "THEN", Order.NONE) || "null";
	const otherwise = ts.valueToCode(block, "ELSE", Order.NONE) || "null";
	return [`${condition} ? ${then} : ${otherwise}`, Order.CONDITIONAL];
});

BlocksToCode.register<typeof UnknownBlock>("unknown", function (block) {
	if (block.shape === "reporter") {
		return [`/* this.${block.opcode}() */`, Order.ATOMIC];
	}
	return `/* this.${block.opcode}(); */\n`;
});

BlocksToCode.register("set", function (block, ts) {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} = ${value || "null"};\n`;
});

BlocksToCode.register("change", function (block, ts) {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} += ${value || "null"};\n`;
});

BlocksToCode.register("variable", function (block, ts) {
	const VAR = ts.valueToCode(block, "VAR", Order.NONE);
	const VALUE = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${block.getFieldValue("kind")} ${VAR} = ${VALUE || "null"};\n`;
});

BlocksToCode.register("showVariable", function (block) {
	return `self.showVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

BlocksToCode.register("hideVariable", function (block) {
	return `self.hideVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

BlocksToCode.register("iterables_string", function (block) {
	return [JSON.stringify(block.getFieldValue("TEXT")), Order.ATOMIC];
});

BlocksToCode.register("rotationStyle", function (block) {
	return [JSON.stringify(block.getFieldValue("STYLE")), Order.ATOMIC];
});

BlocksToCode.register("key", function (block) {
	return [JSON.stringify(block.getFieldValue("KEY")), Order.ATOMIC];
});

BlocksToCode.register("effect", function (block) {
	return [`self.effects.${block.getFieldValue("EFFECT")}`, Order.MEMBER];
});

BlocksToCode.register("sound", "costume_menu", "backdrop_menu", function (block) {
	return [JSON.stringify(block.getFieldValue("NAME")), Order.ATOMIC];
});

BlocksToCode.register("backdrop", "costume", function (block) {
	return [`self.${block.type}.${block.getFieldValue("VALUE")}`, Order.MEMBER];
});

BlocksToCode.register("for", function (block, ts) {
	const variable = block.getField("VAR")?.getText();
	const from = ts.valueToCode(block, "FROM", Order.NONE) || "0";
	const to = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {\n${ts.statementToCode(block, "STACK")}}\n`;
});

BlocksToCode.register("while", function (block, ts) {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `while (${condition}) {\n${ts.statementToCode(block, "STACK")}}\n`;
});

BlocksToCode.register("doWhile", function (block, ts) {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `do {\n${ts.statementToCode(block, "STACK")}} while (${condition});\n`;
});

BlocksToCode.register("break", "continue", function (block) {
	return `${block.type};\n`;
});

BlocksToCode.register("sprite", function (block) {
	const name = block.getFieldValue("SPRITE");
	if (name === "self") {
		return [name, Order.ATOMIC];
	}
	return [`$[${JSON.stringify(name)}]`, Order.MEMBER];
});

BlocksToCode.register("clone", function (block, ts) {
	return `${ts.valueToCode(block, "SPRITE", Order.MEMBER)}.clone();\n`;
});

BlocksToCode.register<typeof ParameterBlock>("parameter", function (block) {
	if (block.isVariable_) {
		return [`self.variables[${JSON.stringify(block.getFieldValue("VAR"))}]`, Order.MEMBER];
	}
	return [block.getFieldValue("VAR"), Order.ATOMIC];
});

BlocksToCode.register("event", function (block) {
	return [JSON.stringify(block.getFieldValue("EVENT")), Order.ATOMIC];
});

BlocksToCode.register<typeof TryBlock>("tryCatch", function (block, ts) {
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

BlocksToCode.register("throw", function (block, ts) {
	const error = ts.valueToCode(block, "ERROR", Order.NONE) || "null";
	return `throw ${error};\n`;
});

BlocksToCode.register("stop", function () {
	return "Scrap.stop();\n";
});

BlocksToCode.register("controls_if", function (block, ts) {
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

BlocksToCode.register("foreach", function (block, ts) {
	const item = block.getFieldValue("VAR");
	const iterable = ts.valueToCode(block, "ITERABLE", Order.NONE) || "[]";
	return `for (const ${item} of ${iterable}) {\n${ts.statementToCode(block, "DO")}}\n`;
});

BlocksToCode.register("property", function (block) {
	return [
		`$[${JSON.stringify(block.getFieldValue("SPRITE"))}].${block.getFieldValue(
			"PROPERTY",
		)}`,
		Order.MEMBER,
	];
});

BlocksToCode.register("isTurbo", function () {
	return ["Scrap.isTurbo()", Order.FUNCTION_CALL];
});

BlocksToCode.register<typeof ArrayBlock>("array", (block, ts) => {
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
	return [
		`new Array${type === "any" ? "" : `<${type}>`}(${items.join(", ")})`,
		Order.FUNCTION_CALL,
	];
});

BlocksToCode.register("length", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.length`, Order.MEMBER];
});

BlocksToCode.register("reverse", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.reverse()`, Order.MEMBER];
});

BlocksToCode.register("join", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const separator = ts.valueToCode(block, "SEPARATOR", Order.NONE) || '""';
	return [`${array}.join(${separator})`, Order.MEMBER];
});

BlocksToCode.register("includes", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.includes(${item})`, Order.MEMBER];
});

BlocksToCode.register("slice", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const start = ts.valueToCode(block, "START", Order.NONE) || "0";
	const end = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return [`${array}.slice(${start}, ${end})`, Order.MEMBER];
});

BlocksToCode.register("indexOf", function (block, ts) {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.indexOf(${item})`, Order.MEMBER];
});

BlocksToCode.register("string", function (block, ts) {
	return [
		`String(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`,
		Order.FUNCTION_CALL,
	];
});

BlocksToCode.register("number", function (block, ts) {
	return [
		`Number(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`,
		Order.FUNCTION_CALL,
	];
});

BlocksToCode.register<typeof FunctionBlock>("function", (block, ts) => {
	const params = block.params.map((_, i) => ts.valueToCode(block, `PARAM_${i}`, Order.NONE));
	const returns = block.returns ? ts.valueToCode(block, "RETURNS", Order.NONE) : "void";
	const name = String(block.getFieldValue("NAME"));
	const nextBlock = block.getNextBlock();
	const body = nextBlock
		? ts.prefixLines(ts.blockToCode(nextBlock) as string, ts.INDENT)
		: "\t\n";

	ts.define(name, `function ${name}(${params.join(", ")}): ${returns} {\n${body}}`);
	return null;
});

BlocksToCode.register("generic", function (block, ts) {
	return [
		`${block.getFieldValue("ITERABLE")}<${
			ts.valueToCode(block, "TYPE", Order.NONE) || "any"
		}>`,
		0,
	];
});

BlocksToCode.register<typeof UnionBlock>("union", function (block, ts) {
	const {count} = block;
	const types = [] as string[];

	for (let i = 0; i < count; i++) {
		types.push(ts.valueToCode(block, `TYPE${i}`, Order.NONE));
	}

	return [types.join(" | "), Order.ATOMIC];
});

BlocksToCode.register("type", function (block) {
	return [block.getFieldValue("TYPE"), Order.ATOMIC];
});

BlocksToCode.register("typed", function (block, ts) {
	return [
		`${block.getField("PARAM")?.getText()}: ${
			ts.valueToCode(block, "TYPE", Order.ATOMIC) || "any"
		}`,
		Order.NONE,
	];
});

BlocksToCode.register("motion_angle", function (block) {
	return [block.getFieldValue("VALUE"), Order.ATOMIC];
});

BlocksToCode.register("text_or_number", function (block) {
	const value = block.getFieldValue("VALUE");

	if (value === "") {
		return ['""', Order.ATOMIC];
	}

	if (!isNaN(Number(value))) {
		return [value, Order.ATOMIC];
	}

	return [JSON.stringify(value), Order.ATOMIC];
});

BlocksToCode.register<typeof CallBlock>("call", (block, ts) => {
	const args = block.params_.map(
		(_, i) => ts.valueToCode(block, `PARAM_${i}`, Order.NONE) || "null",
	);
	const code = `${block.getFieldValue("NAME")}(${args.join(", ")})`;

	if (block.outputConnection) {
		return [code, Order.FUNCTION_CALL];
	} else {
		return `${code};\n`;
	}
});

BlocksToCode.register("return", function (block, ts) {
	const hasInput = Boolean(block.getInput("VALUE"));

	if (hasInput) {
		return `return ${ts.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
	} else {
		return "return;\n";
	}
});

BlocksToCode.register("arithmetics", function (block, ts) {
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

BlocksToCode.register("compare", function (block, ts) {
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

BlocksToCode.register("not", function (block, ts) {
	return [
		`!${ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false"}`,
		Order.LOGICAL_NOT,
	];
});

BlocksToCode.register("boolean", function (block) {
	return [block.getFieldValue("BOOL"), Order.ATOMIC];
});

BlocksToCode.register("math_number", function (block) {
	return [block.getFieldValue("NUM"), Order.ATOMIC];
});

BlocksToCode.register("math", function (block, ts) {
	const number = ts.valueToCode(block, "NUM", Order.NONE) || "0";
	return [`Math.${block.getFieldValue("OP")}(${number})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("constant", function (block) {
	return [block.getFieldValue("CONSTANT"), Order.ATOMIC];
});

BlocksToCode.register("operation", function (block, ts) {
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

BlocksToCode.register("logic_negate", function (block, ts) {
	return [ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false", Order.LOGICAL_NOT];
});

BlocksToCode.register("random", function () {
	return ["Math.random()", Order.FUNCTION_CALL];
});

BlocksToCode.register("item", function (block, ts) {
	const index = ts.valueToCode(block, "INDEX", Order.NONE) || "0";
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}[${index}]`, Order.MEMBER];
});

BlocksToCode.register("rgb", function (block, ts) {
	const r = ts.valueToCode(block, "RED", Order.NONE) || "0";
	const g = ts.valueToCode(block, "GREEN", Order.NONE) || "0";
	const b = ts.valueToCode(block, "BLUE", Order.NONE) || "0";

	return [`Color.fromRGB(${r}, ${g}, ${b})`, Order.FUNCTION_CALL];
});

BlocksToCode.register("color", function (block) {
	return [`Color.fromHex("${block.getFieldValue("COLOR")}")`, Order.ATOMIC];
});

BlocksToCode.register("color_random", function () {
	return ["Color.random()", Order.FUNCTION_CALL];
});

BlocksToCode.register("date", function (block) {
	return [`new Date("${block.getFieldValue("DATE")}")`, Order.FUNCTION_CALL];
});

BlocksToCode.register("today", function () {
	return ["new Date()", Order.FUNCTION_CALL];
});

BlocksToCode.register("dateProperty", function (block, ts) {
	return [
		`${ts.valueToCode(block, "DATE", Order.MEMBER)}.${block.getFieldValue("PROPERTY")}()`,
		Order.FUNCTION_CALL,
	];
});

BlocksToCode.register("alert", function (block, ts) {
	return `window.alert(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'});\n`;
});

BlocksToCode.register("prompt", function (block, ts) {
	return [
		`window.prompt(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`,
		Order.FUNCTION_CALL,
	];
});

BlocksToCode.register("confirm", function (block, ts) {
	return [
		`window.confirm(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`,
		Order.FUNCTION_CALL,
	];
});

export default BlocksToCode;
