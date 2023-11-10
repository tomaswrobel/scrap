import * as Blockly from "blockly/core";
import {parse} from "doctrine";
import {Types, Error, allBlocks, Generator} from "../blockly";
import type {Entity} from "../entities";
import {Identifier, type CallExpression, type MemberExpression, type Node, StringLiteral, IfStatement} from "@babel/types";
import {bind} from "../decorators";

export default class CodeParser {
	connection: Blockly.Connection | null;
	functions = new Map<string, any>();

	constructor(readonly workspace: Blockly.Workspace, readonly entities: Entity[]) {
		this.connection = null;
	}

	async codeToBlock(code: string) {
		window.app.current.variables = [];
		const babel = await import("@babel/core");
		const tree = await babel.parseAsync(code, {});

		if (!tree) {
			console.error("Failed to parse code");
			return;
		}

		this.functions.clear();
		this.workspace.clear();
		tree.program.body.forEach(this.parse);
	}

	block(type: string, shadow = false) {
		const block = this.workspace.newBlock(type);

		if (this.connection) {
			if (block.previousConnection) {
				block.previousConnection.connect(this.connection);
			} else if (block.outputConnection) {
				block.outputConnection.connect(this.connection);
			}
		}

		block.setShadow(shadow);

		return block;
	}

	comments(block: Blockly.Block, node: Node) {
		if (node.leadingComments) {
			block.setCommentText(node.leadingComments.reduce((a, b) => a + b.value + "\n", "").trim());
		}
	}

	isProperty(node: MemberExpression, properties: string[]): node is MemberExpression & {property: Identifier | StringLiteral;} {
		return (
			this.isIdentifier(node.property, ...properties) ||
			(node.property.type === "StringLiteral" && properties.indexOf(node.property.value) > -1)
		);
	}

	isIdentifier(node: Node, ...names: string[]) {
		return node.type === "Identifier" && names.indexOf(node.name) > -1;
	}

	getPropertyContents(property: Identifier | StringLiteral) {
		if (property.type === "Identifier") {
			return property.name;
		} else {
			return property.value;
		}
	}

	parseArguments(block: Blockly.Block, nodes: CallExpression["arguments"]) {
		let i = 0;

		const inputs = block.inputList.filter(input => {
			if (input.type === Blockly.inputTypes.VALUE) {
				// Skip inputs that are already connected
				if (input.connection?.isConnected()) {
					i++;
				}
				return true;
			}
			return false;
		});

		// Sorry for unusual for loop :-)
		for (const shift = i; i < inputs.length; i++) {
			const {connection} = inputs[i];

			this.connection = connection;
			this.parse(nodes[i - shift]);
		}

		if (!block.previousConnection && !block.outputConnection) {
			const arg = nodes[i];

			if (arg?.type === "FunctionExpression") {
				this.connection = block.nextConnection;
				this.parse(arg.body);
			}

			this.connection = null;
		} else {
			this.connection = block.nextConnection;
		}
	}

	@bind
	parse(node?: Node | null) {
		if (!node) {
			return;
		}
		switch (node.type) {
			case "TaggedTemplateExpression": {
				if (this.isIdentifier(node.tag, "sprite")) {
					if (node.quasi.expressions.length === 0) {
						const block = this.block("sprite", true);
						block.setFieldValue(node.quasi.quasis[0].value.raw, "SPRITE");
					} else {
						throw new SyntaxError("Expressions in sprite tag are not supported");
					}
				} else {
					throw new SyntaxError("Unsupported tag");
				}
				break;
			}
			case "NewExpression": {
				if (this.isIdentifier(node.callee, "Date")) {
					if (node.arguments.length === 0) {
						this.block("today");
						break;
					}
					if (node.arguments.length === 1 && node.arguments[0].type === "StringLiteral") {
						this.block("date").setFieldValue(node.arguments[0].value, "DATE");
						break;
					}
				}
				throw new SyntaxError("Only Date() and Date(string) are supported");
			}
			case "SpreadElement":
				this.parse(node.argument);
				break;
			case "NullLiteral":
				break;
			case "NumericLiteral":
				this.block("math_number", true).setFieldValue(node.value, "NUM");
				break;
			case "StringLiteral":
				this.block("iterables_string", true).setFieldValue(node.value, "TEXT");
				break;
			case "BooleanLiteral":
				this.block("boolean").setFieldValue(node.value.toString(), "BOOL");
				break;
			case "ExpressionStatement":
				this.parse({
					...node.expression,
					leadingComments: node.leadingComments,
				});
				break;
			case "ReturnStatement": {
				const block = this.block("return");
				this.comments(block, node);

				if (node.argument) {
					block.loadExtraState!({output: null});
					this.connection = block.getInput("VALUE")!.connection!;
					this.parse(node.argument);
				}

				this.connection = null;
				break;
			}
			case "ContinueStatement":
				this.comments(this.block("continue"), node);
				this.connection = null;
				break;
			case "BreakStatement":
				this.comments(this.block("break"), node);
				this.connection = null;
				break;
			case "VariableDeclaration": {
				if (node.kind !== "var" && node.kind !== "let") {
					throw new SyntaxError("Only var and let declarations are supported");
				}

				const {declarations: [{id, init}], leadingComments} = node;

				if (init) {
					throw new SyntaxError("Only declarations without initializers are supported");
				}

				if (id.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				let varType = "";

				if (leadingComments) {
					for (const {type, value} of leadingComments) {
						if (type === "CommentBlock") {
							const {tags} = parse(`/*${value}*/`, {
								unwrap: true,
								tags: ["type"],
								recoverable: true,
							});

							for (const {title, type: paramType} of tags) {
								if (title === "type") {
									if (paramType!.type === "NameExpression") {
										if (Types.indexOf(paramType!.name) !== -1) {
											varType = paramType!.name;
										} else {
											throw new SyntaxError(`Unsupported type ${paramType!.type}. ${Error}`);
										}
									} else if (paramType!.type === "ArrayType") {
										varType = "Array";
									} else if (paramType!.type !== "AllLiteral") {
										throw new SyntaxError(`Unsupported type ${paramType!.type}. ${Error}`);
									}
								}
							}
						}
					}
				}

				window.app.current.variables.push([Generator.unescape(id.name), varType]);

				break;
			}
			case "ThrowStatement": {
				const block = this.block("throw");
				this.comments(block, node);
				this.connection = block.getInput("ERROR")!.connection!;
				this.parse(node.argument);
				this.connection = null;
				break;
			}
			case "BlockStatement":
				node.body.forEach(this.parse);
				break;
			case "TryStatement": {
				const block = this.block("tryCatch");

				if (node.handler && node.finalizer) {
					const {param, body} = node.handler;

					if (param && param.type !== "Identifier") {
						throw new SyntaxError("Only simple identifiers are supported");
					}

					block.loadExtraState!({
						catch: param ? param.name : true,
						finally: true,
					});

					this.connection = block.getInput("CATCH")!.connection!;
					this.parse(body);

					this.connection = block.getInput("FINALLY")!.connection!;
					this.parse(node.finalizer);
				} else if (node.handler) {
					const {param, body} = node.handler;

					if (param && param.type !== "Identifier") {
						throw new SyntaxError("Only simple identifiers are supported");
					}

					block.loadExtraState!({
						catch: param ? param.name : true,
						finally: false,
					});

					this.connection = block.getInput("CATCH")!.connection!;
					this.parse(body);
				} else if (node.finalizer) {
					block.loadExtraState!({
						finally: true,
						catch: false,
					});

					this.connection = block.getInput("FINALLY")!.connection!;
					this.parse(node.finalizer);
				}

				this.connection = block.nextConnection;
				break;
			}
			case "IfStatement": {
				const block = this.block("controls_if");
				this.comments(block, node);

				this.connection = block.getInput("IF0")!.connection!;
				this.parse(node.test);

				this.connection = block.getInput("DO0")!.connection!;
				this.parse(node.consequent);

				let elseIfCount = 0,
					elseIfStatements: IfStatement[] = [],
					alternate = node.alternate;

				while (alternate && alternate.type === "IfStatement") {
					elseIfCount++;
					elseIfStatements.push(alternate);
				}

				const hasElse = alternate?.type === "BlockStatement";

				block.loadExtraState!({
					elseIfCount,
					hasElse,
				});

				for (const elseIf of elseIfStatements) {
					this.connection = block.getInput(`IF${elseIfCount}`)!.connection!;
					this.parse(elseIf.test);

					this.connection = block.getInput(`DO${elseIfCount}`)!.connection!;
					this.parse(elseIf.consequent);
				}

				if (hasElse) {
					this.connection = block.getInput("ELSE")!.connection!;
					this.parse(alternate!);
				}

				this.connection = block.nextConnection;
				break;
			}
			case "WhileStatement": {
				const block = this.block("while");
				this.comments(block, node);

				this.connection = block.getInput("CONDITION")!.connection!;
				this.parse(node.test);

				this.connection = block.getInput("STACK")!.connection!;
				this.parse(node.body);

				this.connection = block.nextConnection;
				break;
			}
			case "ForStatement": {
				const {init, update, test, body} = node;

				if (!init || !update) {
					throw new SyntaxError("Only for loops with init and update are supported");
				}

				if (!test) {
					throw new SyntaxError("Only for loops with test are supported");
				}

				if (test.type !== "BinaryExpression") {
					throw new SyntaxError("Only binary expressions are supported");
				}

				if (test.operator !== "<") {
					throw new SyntaxError("Only < binary expressions are supported");
				}

				if (update.type !== "UpdateExpression") {
					throw new SyntaxError("Only update expressions are supported");
				}

				if (update.operator !== "++") {
					throw new SyntaxError("Only ++ update expressions are supported");
				}

				if (init.type !== "VariableDeclaration") {
					throw new SyntaxError("Only variable declarations are supported");
				}

				if (init.declarations.length !== 1) {
					throw new SyntaxError("Only one variable declaration is supported");
				}

				const {id, init: dec} = init.declarations[0];

				if (!dec) {
					throw new SyntaxError("Only variable declarations with initializers are supported");
				}

				if (dec.type !== "NumericLiteral" || dec.value) {
					throw new SyntaxError("Only numeric literals with value 0 are supported");
				}

				if (id.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				if (test.left.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				if (test.left.name !== id.name) {
					throw new SyntaxError("Only for loops with the same variable in init and test are supported");
				}

				if (update.argument.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				if (update.argument.name !== id.name) {
					throw new SyntaxError("Only for loops with the same variable in init and update are supported");
				}

				const block = this.block("repeat");
				this.comments(block, node);

				this.connection = block.getInput("TIMES")!.connection!;
				this.parse(test.right);

				this.connection = block.getInput("STACK")!.connection!;
				this.parse(body);

				this.connection = block.nextConnection;
				break;
			}
			case "FunctionDeclaration": {
				const {id, params, body, leadingComments} = node;

				if (!id) {
					throw new SyntaxError("Only named functions are supported");
				}

				const typeMap = new Map<string, string>();

				let returnType = "";
				let commentText = "";

				if (leadingComments) {
					for (const {type, value} of leadingComments) {
						if (type === "CommentLine") {
							commentText += value + "\n";
						} else if (value[0] === "*") {
							const {description, tags} = parse(`/*${value}*/`, {
								unwrap: true,
								tags: ["returns", "param", "return"],
								recoverable: true,
							});

							if (description) {
								commentText += description + "\n";
							}

							for (const {title, type: paramType, name} of tags) {
								if (title === "param") {
									if (paramType!.type === "NameExpression") {
										if (Types.indexOf(paramType!.name) !== -1) {
											typeMap.set(name!, paramType!.name);
										} else {
											throw new SyntaxError(`Unsupported type ${paramType!.type}. ${Error}`);
										}
									} else if (paramType!.type === "ArrayType") {
										typeMap.set(name!, "Array");
									} else if (paramType!.type !== "AllLiteral") {
										throw new SyntaxError(`Unsupported type ${paramType!.type}. ${Error}`);
									}
								} else if (title === "returns" || title === "return") {
									if (paramType!.type === "NameExpression") {
										if (Types.indexOf(paramType.name) !== -1) {
											returnType = paramType.name;
										}
									} else if (paramType!.type === "ArrayType") {
										returnType = "Array";
									}
								}
							}
						} else {
							commentText += value + "\n";
						}
					}
				}

				const block = this.workspace.newBlock("function");

				const extraState = {
					name: id.name,
					params: params.map(param => {
						if (param.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						return {
							name: param.name,
							type: typeMap.get(param.name) || "",
						};
					}),
					returnType,
				};

				block.loadExtraState!(extraState);
				this.functions.set(id.name, extraState);
				block.setCommentText(commentText.trim());

				this.connection = block.nextConnection;
				this.parse(body);

				this.connection = null;
				break;
			}
			case "ArrayExpression": {
				const block = this.block("array");

				block.loadExtraState!({
					items: node.elements.map(element => {
						if (element?.type === "SpreadElement") {
							return "iterable";
						} else {
							return "single";
						}
					}),
				});

				node.elements.forEach((element, i) => {
					this.connection = block.getInput(`ADD${i}`)!.connection!;
					this.parse(element);
				});

				this.connection = null;
				break;
			}
			case "ThisExpression":
				this.block("sprite", true);
				break;
			case "CallExpression": {
				if (node.callee.type === "MemberExpression") {
					if (this.isIdentifier(node.callee.object, "Scrap") && this.isProperty(node.callee, ["delete"])) {
						const block = this.block("stop");
						this.comments(block, node);
						this.connection = null;
					} else if (this.isProperty(node.callee, ["clone"])) {
						const block = this.block("clone");
						this.comments(block, node);
						this.connection = block.getInput("SPRITE")!.connection!;
						this.parse(node.callee.object);
						this.connection = block.nextConnection;
					} else if (this.isProperty(node.callee, ["reverse", "includes", "indexOf", "slice"])) {
						const block = this.block(this.getPropertyContents(node.callee.property));
						this.connection = block.getInput("ITERABLE")!.connection!;
						this.parse(node.callee.object);
						this.parseArguments(block, node.arguments);
					} else if (this.isProperty(node.callee, ["join"])) {
						const block = this.block("join");
						this.connection = block.getInput("ITERABLE")!.connection!;
						this.parse(node.callee.object);
						this.connection = block.getInput("SEPARATOR")!.connection!;
						this.parse(node.arguments[0]);
					} else if (this.isProperty(node.callee, [
						"getFullYear",
						"getMonth",
						"getDate",
						"getDay",
						"getHours",
						"getMinutes",
						"getSeconds"
					])) {
						const block = this.block("dateProperty");
						block.setFieldValue(this.getPropertyContents(node.callee.property), "PROPERTY");
						this.connection = block.getInput("DATE")!.connection!;
						this.parse(node.callee.object);
					} else if (node.callee.object.type === "ThisExpression" && this.isProperty(node.callee, allBlocks)) {
						const block = this.block(this.getPropertyContents(node.callee.property));
						this.comments(block, node);
						this.parseArguments(block, node.arguments);
					} else if (this.isIdentifier(node.callee.object, "Math")) {
						if (
							this.isProperty(node.callee, [
								"abs",
								"floor",
								"round",
								"ceil",
								"sqrt",
								"sin",
								"cos",
								"tan",
								"asin",
								"acos",
								"atan",
								"log",
								"log10",
								"exp",
							])
						) {
							const block = this.block("math");
							block.setFieldValue(this.getPropertyContents(node.callee.property), "OP");
							this.connection = block.getInput("NUM")!.connection!;
							this.parse(node.arguments[0]);
						} else if (this.isProperty(node.callee, ["random"])) {
							this.block("random");
						} else {
							throw new SyntaxError("Unsupported Math function");
						}
					} else if (this.isIdentifier(node.callee.object, "Color")) {
						if (this.isProperty(node.callee, ["fromHex"])) {
							const [arg] = node.arguments;

							if (arg.type !== "StringLiteral") {
								throw new SyntaxError("Only string literals are supported for Color.fromHex");
							}

							const block = this.block("color");
							block.setFieldValue(arg.value, "COLOR");
						} else if (this.isProperty(node.callee, ["fromRGB"])) {
							const block = this.block("color");
							this.connection = block.getInput("RED")!.connection!;
							this.parse(node.arguments[0]);

							this.connection = block.getInput("GREEN")!.connection!;
							this.parse(node.arguments[1]);

							this.connection = block.getInput("BLUE")!.connection!;
							this.parse(node.arguments[2]);
						}
					}
				} else if (this.isIdentifier(node.callee, "String")) {
					const block = this.block("string");
					this.connection = block.getInput("VALUE")!.connection!;
					this.parse(node.arguments[0]);
				} else if (this.isIdentifier(node.callee, "Number")) {
					const block = this.block("number");
					this.connection = block.getInput("VALUE")!.connection!;
					this.parse(node.arguments[0]);
				} else if (node.callee.type === "Identifier") {
					if (this.functions.has(node.callee.name)) {
						const block = this.workspace.newBlock("call");

						block.loadExtraState!(this.functions.get(node.callee.name));

						if (this.connection) {
							if (block.previousConnection) {
								block.previousConnection.connect(this.connection);
							} else if (block.outputConnection) {
								block.outputConnection.connect(this.connection);
							}
						}

						for (let i = 0; i < node.arguments.length; i++) {
							this.connection = block.getInput(`PARAM_${i}`)!.connection!;
							this.parse(node.arguments[i]);
						}

						this.connection = block.nextConnection;
					} else {
						throw new SyntaxError(`Function ${node.callee.name} is not defined`);
					}
				}
				break;
			}
			case "MemberExpression": {
				const {object, property} = node;

				if (property.type !== "Identifier" && property.type !== "StringLiteral") {
					const block = this.block("item");
					this.connection = block.getInput("INDEX")!.connection!;
					this.parse(property);

					this.connection = block.getInput("ITERABLE")!.connection!;
					this.parse(object);
				} else if (this.isIdentifier(property, "length")) {
					const block = this.block("length");
					this.connection = block.getInput("VALUE")!.connection!;
					this.parse(object);
				} else if (object.type === "ThisExpression" && this.isProperty(node, allBlocks)) {
					this.block(this.getPropertyContents(property));
				} else if (object.type === "MemberExpression" && this.isProperty(object, ["effects"])) {
					if (object.object.type === "ThisExpression") {
						const block = this.block("getEffect");
						this.connection = block.getInput("EFFECT")!.connection!;
						if (property.type === "Identifier") {
							this.block("effect", true).setFieldValue(property.name, "EFFECT");
						} else if (property.type === "StringLiteral") {
							this.block("effect", true).setFieldValue(property.value, "EFFECT");
						} else {
							this.parse(property);
						}
					} else {
						const block = this.block("property");
						if (property.type === "Identifier") {
							block.setFieldValue("effects." + property.name, "PROPERTY");
						} else {
							block.setFieldValue("effects." + property.value, "PROPERTY");
						}
						this.connection = block.getInput("SPRITE")!.connection!;
						this.parse(object.object);
					}
				} else if (this.isProperty(node, [
					"x",
					"y",
					"size",
					"direction",
					"volume",
					"penSize",
				])) {
					const block = this.block("property");
					block.setFieldValue(this.getPropertyContents(property), "PROPERTY");
					this.connection = block.getInput("SPRITE")!.connection!;
					this.parse(object);
				} else if (object.type === "Identifier") {
					if (object.name === "Scrap") {
						if (this.isProperty(node, ["isTurbo"])) {
							this.block("isTurbo");
						} else {
							throw new SyntaxError("Unsupported Scrap property");
						}
					} else if (object.name === "Math") {
						if (this.isProperty(node, ["PI", "E"])) {
							this.block("constant").setFieldValue("Math." + this.getPropertyContents(property), "CONSTANT");
						} else {
							throw new SyntaxError("Unsupported Math constant");
						}
					} else {
						throw new SyntaxError("Unsupported object");
					}
				} else {
					throw new SyntaxError("Unsupported sprite property");
				}
				break;
			}
			case "BinaryExpression":
			case "LogicalExpression": {
				switch (node.operator) {
					case "+":
					case "-":
					case "*":
					case "/":
					case "%":
					case "**": {
						const block = this.block("arithmetics");
						block.setFieldValue(node.operator, "OP");
						this.connection = block.getInput("A")!.connection!;
						this.parse(node.left);
						this.connection = block.getInput("B")!.connection!;
						this.parse(node.right);
						break;
					}
					case "!=":
					case "==":
					case "===":
					case "!==":
					case "<":
					case "<=":
					case ">":
					case ">=": {
						const block = this.block("compare");
						block.setFieldValue(node.operator.slice(0, 2), "OP");
						this.connection = block.getInput("A")!.connection!;
						this.parse(node.left);
						this.connection = block.getInput("B")!.connection!;
						this.parse(node.right);
						break;
					}
					case "&&":
					case "||": {
						const block = this.block("operation");
						block.setFieldValue(node.operator, "OP");
						this.connection = block.getInput("A")!.connection!;
						this.parse(node.left);
						this.connection = block.getInput("B")!.connection!;
						this.parse(node.right);
						break;
					}
					default:
						throw new SyntaxError("Unsupported operator");
				}
				break;
			}
			case "UnaryExpression": {
				if (node.operator === "!") {
					const block = this.block("not");
					this.connection = block.getInput("BOOL")!.connection!;
					this.parse(node.argument);
					break;
				} else if (node.operator === "-") {
					if (node.argument.type === "NumericLiteral") {
						this.block("math_number", true).setFieldValue(-node.argument.value, "NUM");
					} else {
						const block = this.block("arithmetics");
						block.setFieldValue("-", "OP");
						this.comments(block, node);

						this.connection = block.getInput("A")!.connection!;
						this.block("math_number", true).setFieldValue(0, "NUM");

						this.connection = block.getInput("B")!.connection!;
						this.parse(node.argument);
					}
				} else if (node.operator === "+") {
					const block = this.block("number");
					this.connection = block.getInput("VALUE")!.connection!;
					this.parse(node.argument);
				} else {
					throw new SyntaxError("Unsupported operator");
				}
				break;
			}
			case "AssignmentExpression": {
				const {left, right, operator} = node;

				if (left.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				if (operator !== "=" && operator !== "+=" && operator !== "-=") {
					throw new SyntaxError("Only =, += and -= operators are supported");
				}

				const block = this.block(operator === "=" ? "setVariable" : "changeVariable");
				this.comments(block, node);

				if (!window.app.current.variables.some(variable => variable[0] === left.name)) {
					throw new SyntaxError(`Variable ${left.name} is not defined`);
				}

				block.setFieldValue(left.name, "VAR");

				this.connection = block.getInput("VALUE")!.connection!;

				if (operator === "-=") {
					if (right.type === "NumericLiteral") {
						this.block("math_number", true).setFieldValue(-right.value, "NUM");
						this.connection = block.nextConnection;
						break;
					}

					const neg = this.block("arithmetics");
					neg.setFieldValue("-", "OP");

					this.connection = neg.getInput("A")!.connection!;
					this.block("math_number", true);

					this.connection = neg.getInput("B")!.connection!;
				}

				this.parse(right);
				this.connection = block.nextConnection;

				break;
			}
			case "ForOfStatement": {
				const {left, right, body} = node;

				if (left.type !== "VariableDeclaration") {
					throw new SyntaxError("Only variable declarations are supported");
				}

				if (left.declarations.length !== 1) {
					throw new SyntaxError("Only one variable declaration is supported");
				}

				const [{id}] = left.declarations;

				if (id.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				const block = this.block("foreach");

				block.setFieldValue(id.name, "VAR");

				this.connection = block.getInput("ITERABLE")!.connection!;
				this.parse(right);

				this.connection = block.getInput("DO")!.connection!;
				this.parse(body);

				this.connection = block.nextConnection;
				break;
			}
			case "Identifier": {
				this.block(window.app.current.variables.some(variable => variable[0] === node.name) ? "getVariable" : "parameter").setFieldValue(node.name, "VAR");
				break;
			}
			default:
				throw new SyntaxError(`Unsupported node type ${node.type}. ${Error}`);
		}
	}
}
