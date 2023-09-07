// Inspired by
// Blockly's JavaScript generator
import * as Blockly from "blockly/core";
import Order from "./order.ts";
import {Block} from "blockly/core";
import type {Entity} from "../../entities";
import {TryBlock} from "../mutators/mutator_try.ts";
import {ArrayBlock} from "../mutators/mutator_array.ts";
import ProcedureBlock from "../utils/procedure_block";
import {CallBlock} from "../mutators/mutator_call.ts";

interface BlockCallback<T extends Blockly.Block = any> {
	(block: T, generator: Generator): null | string | [string, Order];
}

class Generator extends Blockly.CodeGenerator {
	static blocks: Record<string, BlockCallback> = {};

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

	constructor(readonly entity?: Entity, readonly useBlobURLs = true) {
		// ScrapScript is a ES5 subset.
		// However it supports ES2015
		// iterables and for-of loops.
		super("ScrapScript");
		this.isInitialized = false;

		this.addReservedWords(
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords
			"break,case,catch,class,const,continue,debugger,default,delete,do," +
				"else,export,extends,finally,for,function,if,import,in,instanceof," +
				"new,return,super,switch,this,throw,try,typeof,var,void," +
				"while,with,yield," +
				"enum," +
				"implements,interface,let,package,private,protected,public,static," +
				"await," +
				"null,true,false," +
				// Magic variable.
				"arguments," +
				// Everything in the current environment (835 items in Chrome,
				// 104 in Node).
				Object.getOwnPropertyNames(globalThis) +
				// ScrapScript-specific globals.
				"Scrap,Color"
		);

		// @ts-ignore
		this.forBlock = Generator.blocks;
		this.INDENT = "\t";
	}

	init(workspace: Blockly.Workspace) {
		super.init(workspace);

		if (!this.nameDB_) {
			this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
		} else {
			this.nameDB_.reset();
		}

		this.nameDB_.setVariableMap(workspace.getVariableMap());
		this.nameDB_.populateVariables(workspace);
		this.nameDB_.populateProcedures(workspace);

		const vars = Blockly.Variables.allUsedVarModels(workspace).map((variable: Blockly.VariableModel) =>
			this.names.getName(variable.getId(), Blockly.VARIABLE_CATEGORY_NAME)
		);

		if (vars.length > 0) {
			this.definitions_.variables = `var ${vars.join(",\n\t")};`;
		}

		this.isInitialized = true;
	}

	get protection() {
		if (!this.entity) {
			return "";
		}
		return "\n\tawait new Promise(setTimeout)";
	}

	protected scrub_(block: Block, code: string, opt_thisOnly?: boolean): string {
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

	finish(result: string): string {
		const definitions = Object.values(this.definitions_).join("\n\n");
		this.isInitialized = false;
		this.names.reset();

		if (this.entity) {
			const isStage = this.entity.name === "Stage";
			let code = `const ${this.entity.name} = new Scrap.${isStage ? "Stage" : "Sprite"}(${this.getURLsFor(
				this.entity.costumes
			)},${this.getURLsFor(this.entity.sounds)});\n`;

			if (!isStage) {
				code += `${this.entity.name}.addTo(Stage);\n`;
			}

			if (result || definitions) {
				code += "(function () {\n";
				code += this.prefixLines(definitions, this.INDENT);
				code += "\n\n\n";
				code += this.prefixLines(result, this.INDENT);
				code += `}).call(${this.entity.name});\n`;
			}

			return super.finish(code);
		} else {
			return `${definitions}\n\n\n${super.finish(result)}`;
		}
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

	setDefinition(name: string, definition: string) {
		this.definitions_[name] = definition;
	}

	get names() {
		return this.nameDB_!;
	}
}

Generator.blocks.variables_get = function (block: Blockly.Block, generator) {
	const name = generator.names.getName(block.getFieldValue("VAR"), Blockly.Names.NameType.VARIABLE);
	return [name, Order.ATOMIC];
};

Generator.blocks.variables_set = function (block: Blockly.Block, generator) {
	const name = generator.names.getName(block.getFieldValue("VAR"), Blockly.Names.NameType.VARIABLE);
	const value = generator.valueToCode(block, "VALUE", Order.NONE) || "0";
	return `${name} = ${value};\n`;
};

Generator.blocks.color = Generator.blocks.hex = function (block: Blockly.Block) {
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

Generator.blocks.costume = Generator.blocks.sound = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("NAME")), Order.ATOMIC];
};

Generator.blocks.repeat = function (block: Blockly.Block, generator) {
	const times = generator.valueToCode(block, "TIMES", Order.NONE) || "0";
	const i = Blockly.Variables.generateUniqueName(block.workspace);
	return `for (let ${i} = 0; ${i} < ${times}; ${i}++) {${generator.protection}\n${generator.statementToCode(block, "STACK")}}\n`;
};

Generator.blocks.while = function (block: Blockly.Block, generator) {
	const condition = generator.valueToCode(block, "CONDITION", Order.NONE) || "false";
	return `while (${condition}) {${generator.protection}\n${generator.statementToCode(block, "STACK")}}\n`;
};

Generator.blocks.getEffect = function (block: Blockly.Block, generator) {
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

Generator.blocks.event = function (block: Blockly.Block) {
	return [JSON.stringify(block.getFieldValue("EVENT")), Order.ATOMIC];
};

Generator.blocks.tryCatch = function (block: TryBlock, generator) {
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

Generator.blocks.throw = function (block: Blockly.Block, generator) {
	const error = generator.valueToCode(block, "ERROR", Order.NONE) || "null";
	return `throw ${error};\n`;
};

Generator.blocks.controls_if = function (block, generator) {
	// If/elseif/else condition.
	let code = "";
	
	for (let i = 0; block.getInput("IF" + i); i++) {
		const conditionCode = generator.valueToCode(block, "IF" + i, Order.NONE) || "false";
		const branchCode = generator.statementToCode(block, "DO" + i);
		code += `${i ? " else " : ""}if (${conditionCode}) {\n${branchCode}}`
	}

	if (block.getInput("ELSE")) {
		code += ` else {\n${generator.statementToCode(block, "ELSE")}}`
	}
	return code + "\n";
};

Generator.blocks.foreach = function (block: Blockly.Block, generator) {
	const item = block.getField("VAR")!.getText();
	const iterable = generator.valueToCode(block, "ITERABLE", Order.NONE) || "[]";
	return `for ${generator.entity ? "await " : ""}(const ${item} of ${iterable}) {${generator.protection}\n${generator.statementToCode(
		block,
		"DO"
	)}}\n`;
};

Generator.blocks.property = function (block: Blockly.Block, generator) {
	return [`${generator.valueToCode(block, "SPRITE", Order.MEMBER)}.${block.getFieldValue("PROPERTY")}`, Order.MEMBER];
};

Generator.blocks.array = function (block: ArrayBlock, generator) {
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

Generator.blocks.length = function (block: Blockly.Block, generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.length`, Order.MEMBER];
};

Generator.blocks.reverse = function (block: Blockly.Block, generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}.reverse()`, Order.MEMBER];
};

Generator.blocks.includes = function (block: Blockly.Block, generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = generator.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.includes(${item})`, Order.MEMBER];
};

Generator.blocks.indexOf = function (block: Blockly.Block, generator) {
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	const item = generator.valueToCode(block, "ITEM", Order.NONE) || "null";
	return [`${array}.indexOf(${item})`, Order.MEMBER];
};

Generator.blocks.string = function (block: Blockly.Block, generator) {
	return [`String(${generator.valueToCode(block, "VALUE", Order.NONE) || "null"})`, Order.FUNCTION_CALL];
};

Generator.blocks.function = function (block: ProcedureBlock, generator) {
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

	code += ` * @returns {${type || "void"}}\n */\n`;

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

Generator.blocks.call = function (block: CallBlock, generator) {
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

Generator.blocks.return = function (block: Blockly.Block, generator) {
	const hasInput = !!block.getInput("VALUE");

	if (hasInput) {
		return `return ${generator.valueToCode(block, "VALUE", Order.NONE) || "null"};\n`;
	} else {
		return "return;\n";
	}
};

Generator.blocks.arithmetics = function (block: Blockly.Block, generator) {
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

Generator.blocks.compare = function (block: Blockly.Block, generator) {
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

Generator.blocks.math = function (block: Blockly.Block, generator) {
	const number = generator.valueToCode(block, "NUM", Order.NONE) || "0";
	return [`Math.${block.getFieldValue("OP")}(${number})`, Order.FUNCTION_CALL];
};

Generator.blocks.constant = function (block: Blockly.Block) {
	return [block.getFieldValue("CONSTANT"), Order.ATOMIC];
};

Generator.blocks.operation = function (block: Blockly.Block, generator) {
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

Generator.blocks.logic_negate = function (block: Blockly.Block, generator) {
	return [generator.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "false", Order.LOGICAL_NOT];
};

Generator.blocks.random = function () {
	return ["Math.random()", Order.FUNCTION_CALL];
};

Generator.blocks.item = function (block: Blockly.Block, generator) {
	const index = generator.valueToCode(block, "INDEX", Order.NONE) || "0";
	const array = generator.valueToCode(block, "ITERABLE", Order.MEMBER) || "[]";
	return [`${array}[${index}]`, Order.MEMBER];
};

Generator.blocks.rgb = function (block: Blockly.Block, generator) {
	const r = generator.valueToCode(block, "RED", Order.NONE) || "0";
	const g = generator.valueToCode(block, "GREEN", Order.NONE) || "0";
	const b = generator.valueToCode(block, "BLUE", Order.NONE) || "0";

	return [`Color.fromRGB(${r}, ${g}, ${b})`, Order.FUNCTION_CALL];
};

export {Order, Generator};
