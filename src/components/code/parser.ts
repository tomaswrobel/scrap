import * as Blockly from "blockly/core";
import {parse} from "doctrine";
import {Types, Error, allBlocks} from "../../blockly";
import type {Entity} from "../entities";
import {Identifier, type CallExpression, type MemberExpression, type Node, StringLiteral} from "@babel/types";

export default class CodeParser {
	connection: Blockly.Connection | null;
	functions = new Map<string, any>();

	constructor(readonly workspace: Blockly.Workspace, readonly entities: Entity[]) {
		this.connection = null;
		this.parse = this.parse.bind(this);
	}

	async codeToBlock(code: string) {
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

	isProperty(node: MemberExpression, properties: string[]): node is MemberExpression & {property: Identifier | StringLiteral} {
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

	parse(node?: Node | null) {
		if (!node) {
			return;
		}
		switch (node.type) {
			case "NullLiteral":
				break;
			case "NumericLiteral":
				this.block("math_number", true).setFieldValue(node.value.toString(), "NUM");
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
					leadingComments: node.leadingComments
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
				if (node.kind !== "var") {
					throw new SyntaxError("Only var declarations are supported");
				}

				for (const {id, init} of node.declarations) {
					if (init) {
						throw new SyntaxError("Only declarations without initializers are supported");
					}

					if (id.type !== "Identifier") {
						throw new SyntaxError("Only simple identifiers are supported");
					}

					this.workspace.createVariable(id.name);
				}

				break;
			}
			case "ThrowStatement": {
				const block = this.block("throw");
				this.comments(block, node);
				this.connection = block.getInput("ERROR")!.connection!;
				this.parse(node.argument);

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
					elseIfStatements = [],
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
								tags: ["returns", "param"],
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
									} else if (paramType!.type !== "AllLiteral") {
										throw new SyntaxError(`Unsupported type ${paramType!.type}. ${Error}`);
									}
								} else if (title === "returns") {
									if (paramType!.type === "NameExpression") {
										if (Types.indexOf(paramType.name) !== -1) {
											returnType = paramType.name;
										}
									}
								}
							}
						} else {
							commentText += value + "\n";
						}
					}
				}

				const block = this.block("function");

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
				block.setCommentText(commentText);

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

				let i = 0;
				for (const element of node.elements) {
					if (!element) {
					} else if (element.type === "SpreadElement") {
						this.connection = block.getInput(`ADD${i}`)!.connection!;
						this.parse(element.argument);
					} else {
						this.connection = block.getInput(`ADD${i}`)!.connection!;
						this.parse(element);
					}
					i++;
				}

				this.connection = null;
				break;
			}
			case "ThisExpression":
				this.block("sprite", true);
				break;
			case "CallExpression": {
				if (node.callee.type === "MemberExpression") {
					if (this.isProperty(node.callee, ["reverse", "includes", "indexOf", "slice"])) {
						const block = this.block(this.getPropertyContents(node.callee.property));
						this.connection = block.getInput("ITERABLE")!.connection!;
						this.parse(node.callee);
						this.parseArguments(block, node.arguments);
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
				} else if (node.callee.type === "Identifier") {
					if (this.functions.has(node.callee.name)) {
						const block = this.block("call");

						block.loadExtraState!(this.functions.get(node.callee.name));
						let i = 0;
						for (const arg of node.arguments) {
							this.connection = block.getInput(`PARAM_${i}`)!.connection!;
							this.parse(arg);
							i++;
						}
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
				} else if (object.type === "MemberExpression") {
					if (object.object.type === "ThisExpression" && this.isProperty(object, ["effects"])) {
						const block = this.block("getEffect");
						this.connection = block.getInput("EFFECT")!.connection!;
						if (property.type === "Identifier") {
							this.block("effect", true).setFieldValue(property.name, "EFFECT");
						} else if (property.type === "StringLiteral") {
							this.block("effect", true).setFieldValue(property.value, "EFFECT");
						} else {
							this.parse(property);
						}
					}
					if (property.type === "Identifier" && object.property.type === "Identifier" && object.property.name === "effects") {
						const block = this.block("property");
						block.setFieldValue(`effects.${property.name}`, "PROPERTY");
						this.connection = block.getInput("SPRITE")!.connection!;
						this.parse(object.object);
					}
				} else if (object.type === "Identifier") {
					if (object.name === "Math") {
						if (this.isProperty(node, ["PI", "E"])) {
							this.block("constant").setFieldValue("Math." + this.getPropertyContents(property), "CONSTANT");
						} else {
							throw new SyntaxError("Unsupported Math constant");
						}
					} else if (this.entities.some(n => object.name === n.name)) {
						if (property.type === "Identifier") {
							const block = this.block("property");
							block.setFieldValue(property.name, "PROPERTY");
							this.connection = block.getInput("SPRITE")!.connection!;
							this.parse(object);
						}
					}
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
				}
				throw new SyntaxError("Unsupported operator");
			}
			case "AssignmentExpression": {
				const {left, right, operator} = node;

				if (left.type !== "Identifier") {
					throw new SyntaxError("Only simple identifiers are supported");
				}

				if (operator !== "=") {
					throw new SyntaxError("Only = operator is supported");
				}

				const block = this.block("variables_set");
				this.comments(block, node);

				const variable = Blockly.Variables.getOrCreateVariablePackage(this.workspace, null, left.name, "");

				block.setFieldValue(variable.getId(), "VAR");

				this.connection = block.getInput("VALUE")!.connection!;
				this.parse(right);
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
				break;
			}
			case "Identifier": {
				if (this.entities.some(entity => entity.name === node.name)) {
					this.block("sprite", true).setFieldValue(node.name, "SPRITE");
				} else {
					const variable = this.workspace.getVariable(node.name);
					if (variable) {
						const block = this.block("variables_get");
						const variable = Blockly.Variables.getOrCreateVariablePackage(this.workspace, null, node.name);

						block.setFieldValue(variable.getId(), "VAR");
					} else {
						this.block("parameter").setFieldValue(node.name, "VAR");
					}
				}

				break;
			}
			default:
				throw new SyntaxError(`Unsupported node type ${node.type}. ${Error}`);
		}
	}
}
