/**
 * @license MIT
 * @fileoverview Scrap's code generator.
 * @author Tomáš Wróbel
 *
 * Inspired by Blockly's JavaScript generator.
 * Where noted, some parts are directly copied
 * from Blockly's JavaScript generator.
 */
import * as Blockly from "blockly";
import type {Entity} from "../../components/entity";

import type JSZip from "jszip";
import transform from "./javascript";
import {reserved} from "./utils";

import type {FunctionBlock} from "../../blockly/blocks/function";
import type {ParameterBlock} from "../../blockly/blocks/parameter";
import type {TryBlock} from "../../blockly/blocks/try";
import type {ArrayBlock} from "../../blockly/blocks/array";
import type {UnknownBlock} from "../../blockly/blocks/unknown";
import type {CallBlock} from "../../blockly/blocks/call";
import {UnionBlock} from "../../blockly/blocks/union";

interface BlockCallback<T extends Blockly.Block = any> {
	(block: T, ts: TypeScript): null | string | [string, Order];
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
 * 		//...
 * });
 * 
 * $["Sprite"].init(async self => {
 * 		// HERE is the code
 * });
 * ```
 */
class TypeScript extends Blockly.CodeGenerator {
	static blocks: Record<string, BlockCallback> = {};

	// Directly copied from Blockly's JavaScript generator.
	ORDER_OVERRIDES = [
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

	constructor(readonly entity: Entity) {
		// "ScrapScript" is a TypeScript subset. 
		// It supports ES2015 features

		super("ScrapScript");
		this.isInitialized = false;
		this.addReservedWords(`${reserved}`);

		this.forBlock = TypeScript.blocks;
		this.INDENT = "\t";
	}

	init(workspace: Blockly.Workspace) {
		super.init(workspace);
		const vars = this.entity.variables.map(([name, type]) => `\t${JSON.stringify(name)}: ${typeof type === "string" ? type : type.join(" | ")};\n`);

		if (vars.length > 0) {
			this.definitions_.variables = `interface Variables {\n${vars.join("")}}`;
		}

		this.isInitialized = true;
	}

	protected scrub_(block: Blockly.Block, code: string, opt_thisOnly?: boolean): string {
		let commentCode = "";
		// Only collect comments for blocks that aren't inline.
		if (!block.outputConnection || !block.outputConnection.targetConnection) {
			// Collect comment for this block.
			let comment = block.getCommentText();
			if (comment) {
				comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3);
				commentCode += this.prefixLines(comment + "\n", "// ");
			}
			// Collect comments for all value arguments.
			// Don't collect comments for nested statements.
			for (let i = 0; i < block.inputList.length; i++) {
				if (block.inputList[i].type === Blockly.inputTypes.VALUE) {
					const childBlock = block.inputList[i].connection?.targetBlock();
					if (childBlock) {
						comment = this.allNestedComments(childBlock);
						if (comment) {
							commentCode += this.prefixLines(comment, "// ");
						}
					}
				}
			}
		}

		const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
		const nextCode = opt_thisOnly || !block.previousConnection ? "" : this.blockToCode(nextBlock);

		return commentCode + code + nextCode;
	}

	finish(result: string) {
		const definitions = Object.values(this.definitions_).join("\n\n");
		this.isInitialized = false;
		this.nameDB_?.reset();

		return `${definitions}${definitions && "\n\n"}${super.finish(result)}`;
	}

	scrubNakedValue(line: string) {
		return line + ";";
	}

	async ready(zip?: JSZip) {
		const code = this.entity.code;
		const result = await transform(typeof code === "string" ? code : this.workspaceToCode(this.entity.workspace));
		const body = this.prefixLines(result?.code || "", "\t");
		const isStage = this.entity.isStage();
		const configuration = {
			...this.entity.init,
			current: this.entity.current,
			images: this.entity.getURLs("costumes", zip),
			sounds: this.entity.getURLs("sounds", zip),
		};
		const entity = `$[${JSON.stringify(this.entity.name)}]`;
		const init = `${entity} = new Scrap.${isStage ? "Stage" : "Sprite"}(${JSON.stringify(configuration, null, "\t")});`;
		return `${init}\n${entity}.whenLoaded(async self => {\n${body}});\n${isStage ? "" : `${entity}.addTo($["Stage"])`}\n`; 
	}

	static register<Block extends Blockly.Block>(...args: [...string[], BlockCallback<Block>]) {
		const callback = args.pop() as BlockCallback<Blockly.Block>;

		for (const type of args) {
			this.blocks[type as string] = callback;
		}
	}

	set(name: string, value: string) {
		this.definitions_["%" + name] = value;
	}
}

TypeScript.register<UnknownBlock>("unknown", block => {
	if (block.shape === "reporter") {
		return [`/* this.${block.opcode}() */`, Order.ATOMIC];
	}
	return `/* this.${block.opcode}(); */\n`;
});

TypeScript.register("set", (block, ts) => {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} = ${value || "null"};\n`;
});

TypeScript.register("change", (block, ts) => {
	const variable = ts.valueToCode(block, "VAR", Order.NONE);
	const value = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${variable} += ${value || "null"};\n`;
});

TypeScript.register("variable", (block, ts) => {
	const VAR = ts.valueToCode(block, "VAR", Order.NONE);
	const VALUE = ts.valueToCode(block, "VALUE", Order.NONE);
	return `${block.getFieldValue("kind")} ${VAR} = ${VALUE || "null"};\n`;
});

TypeScript.register("showVariable", block => {
	return `self.showVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

TypeScript.register("hideVariable", block => {
	return `self.hideVariable(${JSON.stringify(block.getFieldValue("VAR"))});\n`;
});

TypeScript.register("iterables_string", block => {
	return [JSON.stringify(block.getFieldValue("TEXT")), Order.ATOMIC];
});

TypeScript.register("rotationStyle", block => {
	return [JSON.stringify(block.getFieldValue("STYLE")), Order.ATOMIC];
});

TypeScript.register("key", block => {
	return [JSON.stringify(block.getFieldValue("KEY")), Order.ATOMIC];
});

TypeScript.register("effect", block => {
	return [`self.effects.${block.getFieldValue("EFFECT")}`, Order.MEMBER];
});

TypeScript.register("sound", "costume_menu", "backdrop_menu", block => {
	return [JSON.stringify(block.getFieldValue("NAME")), Order.ATOMIC];
});

TypeScript.register("backdrop", "costume", block => {
	return [`self.${block.type}.${block.getFieldValue("VALUE")}`, Order.MEMBER];
});

TypeScript.register("for", (block, ts) => {
	const variable = block.getField("VAR")!.getText();
	const from = ts.valueToCode(block, "FROM", Order.NONE) || "0";
	const to = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable}++) {\n${ts.statementToCode(block, "STACK")}}\n`;
});

TypeScript.register("while", (block, ts) => {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `while (${condition}) {\n${ts.statementToCode(block, "STACK")}}\n`;
});

TypeScript.register("doWhile", (block, ts) => {
	const condition = ts.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `do {\n${ts.statementToCode(block, "STACK")}} while (${condition});\n`;
});

TypeScript.register("break", "continue", block => {
	return `${block.type};\n`;
});

TypeScript.register("sprite", block => {
	const name = block.getFieldValue("SPRITE");
	if (name === "self") {
		return [name, Order.ATOMIC];
	}
	return [`$[${JSON.stringify(name)}]`, Order.MEMBER];
});

TypeScript.register("clone", (block, ts) => {
	return `${ts.valueToCode(block, "SPRITE", Order.MEMBER)}.clone();\n`;
});

TypeScript.register<ParameterBlock>("parameter", block => {
	if (block.isVariable_) {
		return [`self.variables[${JSON.stringify(block.getFieldValue("VAR"))}]`, Order.MEMBER];
	}
	return [block.getFieldValue("VAR"), Order.ATOMIC];
});

TypeScript.register("event", block => {
	return [JSON.stringify(block.getFieldValue("EVENT")), Order.ATOMIC];
});

TypeScript.register<TryBlock>("tryCatch", (block, ts) => {
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

	return code + "}\n";
});

TypeScript.register("throw", (block, ts) => {
	const error = ts.valueToCode(block, "ERROR", Order.NONE) || "null";
	return `throw ${error};\n`;
});

TypeScript.blocks.stop = function () {
	return "Scrap.stop();\n";
};

TypeScript.register("controls_if", (block, ts) => {
	// If/elseif/else condition.
	let code = "";

	for (let i = 0; block.getInput("IF" + i); i++) {
		const conditionCode = ts.valueToCode(block, "IF" + i, Order.NONE) || "false";
		const branchCode = ts.statementToCode(block, "DO" + i);
		code += `${i ? " else " : ""}if (${conditionCode}) {\n${branchCode}}`;
	}

	if (block.getInput("ELSE")) {
		code += ` else {\n${ts.statementToCode(block, "ELSE")}}`;
	}
	return code + "\n";
});

TypeScript.register("foreach", (block, ts) => {
	const item = block.getFieldValue("VAR");
	const iterable = ts.valueToCode(block, "ITERABLE", Order.NONE) || "[]";
	return `for (const ${item} of ${iterable}) {\n${ts.statementToCode(block, "DO")}}\n`;
});

TypeScript.register("property", block => {
	return [`$[${JSON.stringify(block.getFieldValue("SPRITE"))}].${block.getFieldValue("PROPERTY")}`, Order.MEMBER];
});

TypeScript.blocks.isTurbo = function () {
	return ["Scrap.isTurbo", Order.MEMBER];
};

TypeScript.register("array", (block: ArrayBlock, ts) => {
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

TypeScript.register("length", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.length`, Order.MEMBER];
});

TypeScript.register("reverse", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.reverse()`, Order.MEMBER];
});

TypeScript.register("join", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const separator = ts.valueToCode(block, "SEPARATOR", Order.NONE) || '""';
	return [`${array}.join(${separator})`, Order.MEMBER];
});

TypeScript.register("includes", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.includes(${item})`, Order.MEMBER];
});

TypeScript.register("slice", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const start = ts.valueToCode(block, "START", Order.NONE) || "0";
	const end = ts.valueToCode(block, "TO", Order.NONE) || "0";
	return [`${array}.slice(${start}, ${end})`, Order.MEMBER];
});

TypeScript.register("indexOf", (block, ts) => {
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = ts.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.indexOf(${item})`, Order.MEMBER];
});

TypeScript.register("string", (block, ts) => {
	return [`String(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
});

TypeScript.register("number", (block, ts) => {
	return [`Number(${ts.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
});

TypeScript.register("function", (block: FunctionBlock, ts) => {
	const params = new Array<string>(block.params.length);
	const nextBlock = block.getNextBlock();
	const name = block.getFieldValue("NAME");
	const returns = block.returns
		? ts.valueToCode(block, "RETURNS", Order.NONE)
		: "void"
		;

	for (let i = 0; i < params.length; i++) {
		params[i] = ts.valueToCode(block, "PARAM_" + i, Order.NONE);
	}

	if (nextBlock) {
		var body = ts.prefixLines(
			ts.blockToCode(nextBlock) as string,
			ts.INDENT
		);
	} else {
		var body = "\t\n";
	}

	ts.set(name, `function ${name}(${params.join(", ")}): ${returns} {\n${body}}`);
	return null;
});

TypeScript.register("generic", (block, ts) => {
	return [`${block.getFieldValue("ITERABLE")}<${ts.valueToCode(block, "TYPE", Order.NONE) || "any"}>`, 0];
});

TypeScript.register<UnionBlock>("union", (block, ts) => {
	const count = block.count;
	const types = [] as string[];

	for (let i = 0; i < count; i++) {
		types.push(ts.valueToCode(block, `TYPE${i}`, Order.NONE));
	}

	return [types.join(" | "), Order.ATOMIC];
});

TypeScript.register("type", block => {
	return [block.getFieldValue("TYPE"), Order.ATOMIC];
});

TypeScript.register("typed", (block, ts) => {
	return [`${block.getField("PARAM")!.getText()}: ${ts.valueToCode(block, "TYPE", Order.ATOMIC) || "any"}`, Order.NONE];
});

TypeScript.register("motion_angle", block => {
	return [block.getFieldValue("VALUE"), Order.ATOMIC];
});

TypeScript.register("text_or_number", block => {
	const value = block.getFieldValue("VALUE");

	if (value === "") {
		return ['""', Order.ATOMIC];
	}

	if (!isNaN(Number(value))) {
		return [value, Order.ATOMIC];
	}

	return [JSON.stringify(value), Order.ATOMIC];
});

TypeScript.register("call", (block: CallBlock, ts) => {
	const args = block.params_.map((_, i) => ts.valueToCode(block, "PARAM_" + i, Order.NONE) || "null");
	const code = `${block.getFieldValue("NAME")}(${args.join(", ")})`;

	if (block.outputConnection) {
		return [code, Order.FUNCTION_CALL];
	} else {
		return code + ";\n";
	}
});

TypeScript.register("return", (block, ts) => {
	const hasInput = !!block.getInput("VALUE");

	if (hasInput) {
		return `return ${ts.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
	} else {
		return "return;\n";
	}
});

TypeScript.register("arithmetics", (block, ts) => {
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

TypeScript.register("compare", (block, ts) => {
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

TypeScript.register("not", (block, ts) => {
	return [`!${ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false"}`, Order.LOGICAL_NOT];
});

TypeScript.register("boolean", block => {
	return [block.getFieldValue("BOOL"), Order.ATOMIC];
});

TypeScript.register("math_number", block => {
	return [block.getFieldValue("NUM"), Order.ATOMIC];
});

TypeScript.register("math", (block, ts) => {
	const number = ts.valueToCode(block, "NUM", Order.NONE) || "0";
	return [`Math.${block.getFieldValue("OP")}(${number})`, Order.FUNCTION_CALL];
});

TypeScript.register("constant", block => {
	return [block.getFieldValue("CONSTANT"), Order.ATOMIC];
});

TypeScript.register("operation", (block, ts) => {
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

TypeScript.register("logic_negate", (block, ts) => {
	return [ts.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false", Order.LOGICAL_NOT];
});

TypeScript.blocks.random = function () {
	return ["Math.random()", Order.FUNCTION_CALL];
};

TypeScript.register("item", (block, ts) => {
	const index = ts.valueToCode(block, "INDEX", Order.NONE) || "0";
	const array = ts.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}[${index}]`, Order.MEMBER];
});

TypeScript.register("rgb", (block, ts) => {
	const r = ts.valueToCode(block, "RED", Order.NONE) || "0";
	const g = ts.valueToCode(block, "GREEN", Order.NONE) || "0";
	const b = ts.valueToCode(block, "BLUE", Order.NONE) || "0";

	return [`Color.fromRGB(${r}, ${g}, ${b})`, Order.FUNCTION_CALL];
});


TypeScript.register("color", block => {
	return [`Color.fromHex("${block.getFieldValue("COLOR")}")`, Order.ATOMIC];
});

TypeScript.blocks.color_random = function () {
	return ["Color.random()", Order.FUNCTION_CALL];
};

TypeScript.register("date", block => {
	return [`new Date("${block.getFieldValue("DATE")}")`, Order.FUNCTION_CALL];
});

TypeScript.blocks.today = function () {
	return ["new Date()", Order.FUNCTION_CALL];
};

TypeScript.register("dateProperty", (block, ts) => {
	return [
		`${ts.valueToCode(block, "DATE", Order.MEMBER)}.${block.getFieldValue("PROPERTY")}()`,
		Order.FUNCTION_CALL,
	];
});

TypeScript.register("alert", (block, ts) => {
	return `window.alert(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'});\n`;
});

TypeScript.register("prompt", (block, ts) => {
	return [`window.prompt(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`, Order.FUNCTION_CALL];
});

TypeScript.register("confirm", (block, ts) => {
	return [`window.confirm(${ts.valueToCode(block, "TEXT", Order.NONE) || '""'})`, Order.FUNCTION_CALL];
});

enum Order {
	ATOMIC = 0,            // 0 "" ...
	NEW = 1.1,             // new
	MEMBER = 1.2,          // . []
	FUNCTION_CALL = 2,     // ()
	INCREMENT = 3,         // ++
	DECREMENT = 3,         // --
	BITWISE_NOT = 4.1,     // ~
	UNARY_PLUS = 4.2,      // +
	UNARY_NEGATION = 4.3,  // -
	LOGICAL_NOT = 4.4,     // !
	TYPEOF = 4.5,          // typeof
	VOID = 4.6,            // void
	DELETE = 4.7,          // delete
	AWAIT = 4.8,           // await
	EXPONENTIATION = 5.0,  // **
	MULTIPLICATION = 5.1,  // *
	DIVISION = 5.2,        // /
	MODULUS = 5.3,         // %
	SUBTRACTION = 6.1,     // -
	ADDITION = 6.2,        // +
	BITWISE_SHIFT = 7,     // << >> >>>
	RELATIONAL = 8,        // < <= > >=
	IN = 8,                // in
	INSTANCEOF = 8,        // instanceof
	EQUALITY = 9,          // == != === !==
	BITWISE_AND = 10,      // &
	BITWISE_XOR = 11,      // ^
	BITWISE_OR = 12,       // |
	LOGICAL_AND = 13,      // &&
	LOGICAL_OR = 14,       // ||
	CONDITIONAL = 15,      // ?:
	ASSIGNMENT = 16,       //: += -= **= *= /= %= <<= >>= ...
	YIELD = 17,            // yield
	COMMA = 18,            // ,
	NONE = 99,             // (...)
}

export {Order, TypeScript};