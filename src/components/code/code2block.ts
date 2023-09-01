import * as Blockly from "blockly/core";
import {parse} from "doctrine";
import blocks from "../../blockly/data/blocks.json";
import {Types, Error} from "../../blockly/utils/types";
import type {Entity} from "../entities";

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

	comments(block: Blockly.Block, node: import("@babel/types").Node) {
		if (node.leadingComments) {
			block.setCommentText(node.leadingComments.reduce((a, b) => a + b.value + "\n", ""));
		}
	}

	parse(node: import("@babel/types").Node) {
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
				this.parse(node.expression);
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
			case "YieldExpression":
				this.connection = this.block("yield").getInput("VALUE")!.connection!;
				this.parse(node.argument!);
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

				if (node.generator) {
					returnType = "Iterator";
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
					const {object, property} = node.callee;

					if (object.type === "ThisExpression") {
						if (property.type === "Identifier") {
							if (property.name in blocks) {
								const block = this.block(property.name);
								const data = blocks[property.name as keyof typeof blocks];

								if ("args0" in data) {
									for (const i of data.args0) {
										if (i.type === "input_value") {
											this.connection = block.getInput(i.name)!.connection!;
											this.parse(node.arguments.shift()!);
										}
									}
								}

								if (!("previousStatement" in data)) {
									const arg = node.arguments.shift();

									if (arg?.type === "FunctionExpression") {
										this.connection = block.nextConnection;
										this.parse(arg.body);
									}
								}

								this.connection = block.nextConnection;
							} else {
                                throw new SyntaxError(`Method ${property.name} is not defined`);
                            }
						} else {
							throw new SyntaxError("Only simple identifiers are supported");
						}
					} else if (object.type === "Identifier") {
						switch (object.name) {
							case "Math":
							case "Color": {
								if (property.type === "Identifier") {
									if (property.name in blocks) {
										const block = this.block(property.name);
										const data = blocks[property.name as keyof typeof blocks];

										if ("args0" in data) {
											for (const i of data.args0) {
												if (i.type === "input_value") {
													this.connection = block.getInput(i.name)!.connection!;
													this.parse(node.arguments.shift()!);
												}
											}
										}
										break;
									} else {
										throw new SyntaxError("Unsupported function");
									}
								} else {
									throw new SyntaxError("Only simple identifiers are supported");
								}
							}
							default:
								throw new SyntaxError("Only Math and Color are supported");
						}
					}
				} else if (node.callee.type === "Identifier") {
					switch (node.callee.name) {
						case "String": {
							const block = this.block("string");
							this.connection = block.getInput("VALUE")!.connection!;
							this.parse(node.arguments.shift()!);
							break;
						}
						default: {
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
					}
				}

				break;
			}
			case "MemberExpression": {
				const {object, property} = node;

				if (object.type === "ThisExpression") {
					if (property.type === "Identifier") {
						if (property.name in blocks) {
							this.block(property.name);
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
			case "NewExpression": {
				if (node.callee.type === "Identifier" && node.callee.name === "Color") {
					if (node.arguments.length === 1) {
						this.parse(node.arguments[0]);
						break;
					} else if (node.arguments.length === 3) {
						const [r, g, b] = node.arguments;

						const block = this.block("rgb");
						this.connection = block.getInput("RED")!.connection!;
						this.parse(r);

						this.connection = block.getInput("GREEN")!.connection!;
						this.parse(g);

						this.connection = block.getInput("BLUE")!.connection!;
						this.parse(b);

						break;
					}
				}
				throw new SyntaxError("Illegal constructor");
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
			case "ImportDeclaration":
				if (node.source.value === "scrap-engine") {
					break;
				}
			default:
				throw new SyntaxError(`Unsupported node type ${node.type}. ${Error}`);
		}
	}
}
