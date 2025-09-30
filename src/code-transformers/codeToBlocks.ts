/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Typescript → Blocks
 *
 * This file is responsible for transforming TypeScript code into Blockly
 * blocks. It uses SWC to parse the code and Blockly to generate the
 * blocks. The transformation is done in a way that the blocks are
 * generated in the same order as the code is written. This is done by
 * traversing the AST and creating blocks for each node.
 */
import {properties} from "@scrap/blockly";
import type {Entity} from "@scrap/types/Enity.svelte.ts";
import type {Check} from "@scrap/types/Check";
import {EntityModeSwitcher} from "@scrap/types/EntityModeSwitcher";
import type {Variable} from "@scrap/types/Variable";
import {blockToCheck} from "@scrap/utils/blockToCheck";
import * as SWC from "@scrap/utils/swc";
import * as Blockly from "blockly/core";
import {ScrapTypes} from "@scrap/blockly/types";

@EntityModeSwitcher("code", "blocks")
class CodeToBlocks {
	private connection?: Blockly.Connection | null;
	public readonly workspace: Blockly.Workspace;
	private readonly functions = new Map<string, CodeToBlocks.Function>();
	private readonly variables: Variable[] = [];

	private constructor(workspace: Blockly.Workspace) {
		this.workspace = workspace;
	}

	public static async switch(e: Entity) {
		if (!e.typescript) {
			return;
		}

		const tree = await SWC.parse(e.typescript);
		const parser = new this(e.workspace);
		tree.body.forEach(parser.parse, parser);
		e.variables = parser.variables;
	}

	private block(type: string) {
		const block = this.workspace.newBlock(type);

		if (this.connection) {
			if (block.previousConnection) {
				block.previousConnection.connect(this.connection);
			} else if (block.outputConnection) {
				block.outputConnection.connect(this.connection);
			}
		}

		return block;
	}

	private parseArguments(block: Blockly.Block, nodes: SWC.CallExpression["arguments"]) {
		let i = 0;

		const inputs = block.inputList.filter(input => {
			if (input.type === Blockly.inputs.inputTypes.VALUE) {
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
			this.parse(nodes[i - shift].expression);
		}

		if (!block.previousConnection && !block.outputConnection) {
			const arg = nodes[i].expression;

			if (arg?.type === "FunctionExpression" || arg?.type === "ArrowFunctionExpression") {
				this.connection = block.nextConnection;
				this.parse(arg.body);
			}

			this.connection = null;
		} else {
			this.connection = block.nextConnection;
		}
	}

	private parse(node?: SWC.Node | null): void {
		if (node) {
			switch (node.type) {
				case "TsKeywordType": {
					const block = this.block("type");
					block.setFieldValue(node.kind, "TYPE");
					this.connection?.setShadowState({type: "type"});
					break;
				}
				case "TsArrayType": {
					const block = this.block("generic");
					block.setFieldValue("Array", "ITERABLE");
					this.connection = block.getInput("TYPE")!.connection;
					this.parse(node.elemType);
					break;
				}
				case "TsUnionType": {
					const block = this.block("union");

					block.loadExtraState!({
						count: node.types.length,
					});

					for (let i = 0; i < node.types.length; i++) {
						this.connection = block.getInput(`TYPE${i}`)!.connection;
						this.parse(node.types[i]);
					}

					break;
				}
				case "TsExpressionWithTypeArguments": {
					if (node.expression.type === "Identifier") {
						if (
							node.expression.value === "Array" ||
							node.expression.value === "Iterable"
						) {
							const block = this.block("generic");
							block.setFieldValue(node.expression.value, "ITERABLE");
							this.connection = block.getInput("TYPE")!.connection;
							this.parse(node.typeArguments?.params?.[0]);
						} else if (node.expression.value === "Sprite") {
							const block = this.block("type");
							block.setFieldValue("Sprite", "TYPE");
						} else {
							throw new TypeError(
								`Type "${node.expression.value}" is not known generic`,
							);
						}
					}
					break;
				}
				case "TsParenthesizedType": {
					this.parse(node.typeAnnotation);
					break;
				}
				case "TsTypeReference": {
					if (node.typeName.type === "Identifier") {
						if (
							node.typeName.value === "Date" ||
							node.typeName.value === "Color" ||
							node.typeName.value === "Sprite"
						) {
							const block = this.block("type");
							block.setFieldValue(node.typeName.value, "TYPE");
						} else {
							throw new TypeError(`Unknown type "${node.typeName.type}"`);
						}
					}
					break;
				}
				case "ExpressionStatement": {
					this.parse(node.expression);
					break;
				}
				case "ConditionalExpression": {
					const block = this.block("ternary");

					this.connection = block.getInput("CONDITION")!.connection;
					this.parse(node.test);

					this.connection = block.getInput("THEN")!.connection;
					this.parse(node.consequent);

					this.connection = block.getInput("ELSE")!.connection;
					this.parse(node.alternate);

					this.connection = null;

					break;
				}
				case "NewExpression": {
					if (SWC.isIdentifier(node.callee, "Date")) {
						if (!node.arguments?.length) {
							this.block("today");
						} else if (
							node.arguments.length === 1 &&
							node.arguments[0].expression.type === "StringLiteral"
						) {
							const block = this.block("date");
							block.setFieldValue(node.arguments[0].expression.value, "DATE");
						}
						break;
					} else if (SWC.isIdentifier(node.callee, "Array")) {
						const block = this.block("array");
						block.loadExtraState!({
							items: node.arguments?.map(arg => {
								if (arg.spread) {
									return "iterable";
								} else {
									return "single";
								}
							}),
						});

						this.connection = block.getInput("TYPE")!.connection;
						this.connection!.setShadowState({type: "type"});
						this.parse(node.typeArguments?.params[0]);

						node.arguments?.forEach((arg, i) => {
							this.connection = block.getInput(`ADD${i}`)!.connection;
							this.parse(arg.expression);
						});

						this.connection = block.nextConnection;

						break;
					}
					throw new SyntaxError("Unknown class");
				}
				case "NullLiteral":
					break;
				case "NumericLiteral": {
					this.connection?.setShadowState({
						type: "math_number",
						fields: {
							NUM: node.value,
						},
					});
					break;
				}
				case "StringLiteral": {
					this.connection?.setShadowState({
						type: "iterables_string",
						fields: {
							TEXT: node.value,
						},
					});
					break;
				}
				case "BooleanLiteral": {
					this.block("boolean").setFieldValue(node.value.toString(), "BOOL");
					break;
				}
				case "ReturnStatement": {
					const block = this.block("return");

					if (node.argument) {
						block.loadExtraState!({output: "any"});
						this.connection = block.getInput("VALUE")!.connection;
						this.parse(node.argument);
					}

					this.connection = null;
					break;
				}
				case "ContinueStatement": {
					this.block("continue");
					this.connection = null;
					break;
				}
				case "BreakStatement": {
					this.block("break");
					this.connection = null;
					break;
				}
				case "ThrowStatement": {
					const block = this.block("throw");
					this.connection = block.getInput("ERROR")!.connection;
					this.parse(node.argument);
					this.connection = null;
					break;
				}
				case "BlockStatement":
					node.stmts.forEach(this.parse, this);
					break;
				case "VariableDeclaration": {
					for (let i = 0; i < node.declarations.length; i++) {
						const {id, init} = node.declarations[i];
						const block = this.block("variable");

						block.setFieldValue(node.kind, "kind");

						if (id.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						this.connection = block.getInput("VAR")!.connection;
						const typed = this.block("typed");
						this.connection = typed.getInput("TYPE")!.connection;
						if (SWC.hasType(id)) {
							typed.setFieldValue(
								`${id.value}:${SWC.getType(id.typeAnnotation.typeAnnotation)}`,
								"PARAM",
							);
							this.parse(id.typeAnnotation.typeAnnotation);
							this.connection?.targetBlock()?.setShadow(true);
						} else {
							this.connection?.setShadowState({
								type: "type",
							});
							typed.setFieldValue(id.value, "PARAM");
						}

						this.connection = block.getInput("VALUE")!.connection;
						this.parse(init);

						this.connection = block.nextConnection;
					}
					break;
				}
				case "TryStatement": {
					const block = this.block("tryCatch");

					this.connection = block.getInput("TRY")!.connection;
					this.parse(node.block);

					if (node.handler && node.finalizer) {
						const {param, body} = node.handler;

						if (param && param.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						block.loadExtraState!({
							catch: param ? param.value : true,
							finally: true,
						});

						this.connection = block.getInput("CATCH")!.connection;
						this.parse(body);

						this.connection = block.getInput("FINALLY")!.connection;
						this.parse(node.finalizer);
					} else if (node.handler) {
						const {param, body} = node.handler;

						if (param && param.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						block.loadExtraState!({
							catch: param ? param.value : true,
							finally: false,
						});

						this.connection = block.getInput("CATCH")!.connection;
						this.parse(body);
					} else if (node.finalizer) {
						block.loadExtraState!({
							finally: true,
							catch: false,
						});

						this.connection = block.getInput("FINALLY")!.connection;
						this.parse(node.finalizer);
					}

					this.connection = block.nextConnection;

					break;
				}
				case "IfStatement": {
					const block = this.block("controls_if");
					this.connection = block.getInput("IF0")!.connection;
					this.parse(node.test);

					this.connection = block.getInput("DO0")!.connection;
					this.parse(node.consequent);

					const elseIfStatements: SWC.IfStatement[] = [];

					while (node.alternate && node.alternate.type === "IfStatement") {
						elseIfStatements.push(node.alternate);
					}

					const hasElse = node.alternate?.type === "BlockStatement";

					block.loadExtraState!({
						elseIfCount: elseIfStatements.length,
						hasElse,
					});

					for (let i = 0; i < elseIfStatements.length; i++) {
						this.connection = block.getInput(`IF${i}`)!.connection;
						this.parse(elseIfStatements[i].test);

						this.connection = block.getInput(`DO${i}`)!.connection;
						this.parse(elseIfStatements[i].consequent);
					}

					if (hasElse) {
						this.connection = block.getInput("ELSE")!.connection;
						this.parse(node.alternate);
					}

					this.connection = block.nextConnection;

					break;
				}
				case "WhileStatement": {
					const block = this.block("while");

					this.connection = block.getInput("CONDITION")!.connection;
					this.parse(node.test);

					this.connection = block.getInput("STACK")!.connection;
					this.parse(node.body);

					this.connection = block.nextConnection;

					break;
				}
				case "ForStatement": {
					const {init, update, test, body} = node;

					if (!init && !update && !test) {
						// while true
						const block = this.block("while");
						this.connection = block.getInput("CONDITION")!.connection;
						this.block("boolean");

						this.connection = block.getInput("STACK")!.connection;
						this.parse(node.body);

						this.connection = block.nextConnection;
					} else {
						try {
							if (!init || !update) {
								throw new SyntaxError(
									"Only for loops with init and update are supported",
								);
							}

							if (!test) {
								throw new SyntaxError("Only for loops with test are supported");
							}

							if (init.type !== "VariableDeclaration") {
								throw new SyntaxError(
									"Only variable declarations are supported",
								);
							}

							if (test.type !== "BinaryExpression") {
								throw new SyntaxError("Only binary expressions are supported");
							}

							if (test.operator !== "<=") {
								throw new SyntaxError(
									"Only <= binary expressions are supported",
								);
							}

							if (update.type !== "UpdateExpression") {
								throw new SyntaxError("Only update expressions are supported");
							}

							if (update.operator !== "++") {
								throw new SyntaxError(
									"Only ++ update expressions are supported",
								);
							}

							if (init.declarations.length !== 1) {
								throw new SyntaxError(
									"Only one variable declaration is supported",
								);
							}

							const {id, init: dec} = init.declarations[0];

							if (!dec) {
								throw new SyntaxError(
									"Only variable declarations with initializers are supported",
								);
							}

							if (id.type !== "Identifier") {
								throw new SyntaxError("Only simple identifiers are supported");
							}

							if (test.left.type !== "Identifier") {
								throw new SyntaxError("Only simple identifiers are supported");
							}

							if (test.left.value !== id.value) {
								throw new SyntaxError(
									"Only for loops with the same variable in init and test are supported",
								);
							}

							if (update.argument.type !== "Identifier") {
								throw new SyntaxError("Only simple identifiers are supported");
							}

							if (update.argument.value !== id.value) {
								throw new SyntaxError(
									"Only for loops with the same variable in init and update are supported",
								);
							}

							const block = this.block("for");
							block.setFieldValue(`${id.value}:number`, "VAR");

							this.connection = block.getInput("TO")!.connection;
							this.parse(test.right);

							this.connection = block.getInput("FROM")!.connection;
							this.parse(dec);

							this.connection = block.getInput("STACK")!.connection;
							this.parse(body);

							this.connection = block.nextConnection;
						} catch {
							// Convert to "while" block
							this.parse(node.init);

							const block = this.block("while");

							this.connection = block.getInput("CONDITION")!.connection;
							this.parse(node.test);

							this.connection = block.getInput("STACK")!.connection;
							this.parse(node.body);

							this.connection = block.nextConnection;
							this.parse(node.update);
						}
					}

					break;
				}
				case "FunctionDeclaration": {
					const params: string[] = [];

					const block = this.workspace.newBlock("function");
					block.setFieldValue(node.identifier.value, "NAME");

					const types = new Array<SWC.TsType | null>();

					for (const {pat: param} of node.params) {
						if (param.type !== "Identifier") {
							continue;
						}

						params.push(param.value);

						if (SWC.hasType(param)) {
							types.push(param.typeAnnotation.typeAnnotation);
						} else {
							types.push(null);
						}
					}

					block.loadExtraState!({
						params,
						returns: node.returnType
							? node.returnType.typeAnnotation.type === "TsKeywordType"
								? node.returnType.typeAnnotation.kind !== "void"
								: true
							: false,
					});

					types.forEach((type, i) => {
						this.connection = block
							.getInput(`PARAM_${i}`)!
							.connection!.targetBlock()!
							.getInput("TYPE")!.connection!;
						this.parse(type);
					});

					if ((this.connection = block.getInput("RETURNS")?.connection)) {
						this.parse(node.returnType!.typeAnnotation);

						this.functions.set(node.identifier.value, {
							params,
							name: node.identifier.value,
							returnType: blockToCheck(this.connection.targetBlock()),
						});
					} else {
						this.functions.set(node.identifier.value, {
							params,
							name: node.identifier.value,
							returnType: false,
						});
					}

					this.connection = block.nextConnection;
					this.parse(node.body);

					this.connection = null;

					break;
				}
				case "ArrayExpression": {
					const block = this.block("array");

					this.connection = block.getInput("TYPE")!.connection;
					this.connection!.setShadowState({type: "type"});

					block.loadExtraState!({
						items: node.elements.map(element => {
							if (element?.spread) {
								return "iterable";
							} else {
								return "single";
							}
						}),
					});

					node.elements.forEach((element, i) => {
						this.connection = block.getInput(`ADD${i}`)!.connection;
						this.parse(element?.expression);
					});

					this.connection = null;

					break;
				}
				case "CallExpression": {
					if (node.callee.type === "MemberExpression") {
						if (
							SWC.isIdentifier(node.callee.object, "window") &&
							SWC.isProperty(node.callee, "alert", "prompt", "confirm")
						) {
							const block = this.block(
								SWC.getPropertyContents(node.callee.property),
							);
							this.connection = block.getInput("TEXT")!.connection!;
							this.parse(node.arguments[0].expression);
							this.connection = block.nextConnection;
						} else if (SWC.isIdentifier(node.callee.object, "Color")) {
							if (SWC.isProperty(node.callee, "fromHex")) {
								const block = this.block("color");
								if (node.arguments[0].expression.type === "StringLiteral") {
									block.setFieldValue(
										node.arguments[0].expression.value,
										"COLOR",
									);
								} else {
									throw new SyntaxError("Only string literals are supported");
								}
							} else if (SWC.isProperty(node.callee, "fromRGB")) {
								const block = this.block("rgb");
								this.connection = block.getInput("RED")!.connection!;
								this.parse(node.arguments[0].expression);
								this.connection = block.getInput("GREEN")!.connection!;
								this.parse(node.arguments[1].expression);
								this.connection = block.getInput("BLUE")!.connection!;
								this.parse(node.arguments[2].expression);
							} else if (SWC.isProperty(node.callee, "random")) {
								this.block("color_random");
							}
						} else if (
							SWC.isIdentifier(node.callee.object, "Scrap") &&
							SWC.isProperty(node.callee, "delete")
						) {
							this.block("stop");
							this.connection = null;
						} else if (SWC.isProperty(node.callee, "getTime", "valueOf")) {
							const block = this.block("number");
							this.connection = block.getInput("VALUE")!.connection;
							this.parse(node.callee.object);
						} else if (SWC.isProperty(node.callee, "toString")) {
							const block = this.block("string");
							this.connection = block.getInput("VALUE")!.connection;
							this.parse(node.callee.object);
						} else if (SWC.isProperty(node.callee, "clone")) {
							const block = this.block("clone");
							this.connection = block.getInput("SPRITE")!.connection!;
							this.parse(node.callee.object);
							this.connection = block.nextConnection;
						} else if (
							SWC.isProperty(
								node.callee,
								"reverse",
								"includes",
								"indexOf",
								"slice",
							)
						) {
							const block = this.block(
								SWC.getPropertyContents(node.callee.property),
							);
							this.connection = block.getInput("ITERABLE")!.connection!;
							this.parse(node.callee.object);
							this.parseArguments(block, node.arguments);
						} else if (SWC.isProperty(node.callee, "join")) {
							const block = this.block("join");
							this.connection = block.getInput("ITERABLE")!.connection!;
							this.parse(node.callee.object);
							this.connection = block.getInput("SEPARATOR")!.connection!;
							this.parse(node.arguments[0].expression);
						} else if (
							SWC.isProperty(
								node.callee,
								"getFullYear",
								"getMonth",
								"getDate",
								"getDay",
								"getHours",
								"getMinutes",
								"getSeconds",
							)
						) {
							const block = this.block("dateProperty");
							block.setFieldValue(
								SWC.getPropertyContents(node.callee.property),
								"PROPERTY",
							);
							this.connection = block.getInput("DATE")!.connection!;
							this.parse(node.callee.object);
						} else if (
							SWC.isIdentifier(node.callee.object, "self") &&
							SWC.isProperty(node.callee, ...properties)
						) {
							const block = this.block(
								SWC.getPropertyContents(node.callee.property),
							);
							this.parseArguments(block, node.arguments);
						} else if (SWC.isIdentifier(node.callee.object, "Math")) {
							if (
								SWC.isProperty(
									node.callee,
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
								)
							) {
								const block = this.block("math");
								block.setFieldValue(
									SWC.getPropertyContents(node.callee.property),
									"OP",
								);
								this.connection = block.getInput("NUM")!.connection!;
								this.parse(node.arguments[0].expression);
							} else if (SWC.isProperty(node.callee, "random")) {
								this.block("random");
							} else {
								throw new SyntaxError("Unsupported Math function");
							}
						} else {
							throw new SyntaxError("Unsupported function call");
						}
					} else if (node.callee.type === "Identifier") {
						if (this.functions.has(node.callee.value)) {
							const block = this.workspace.newBlock("call");
							block.setFieldValue(node.callee.value, "NAME");

							block.loadExtraState!(this.functions.get(node.callee.value));

							if (this.connection) {
								if (block.previousConnection) {
									block.previousConnection.connect(this.connection);
								} else if (block.outputConnection) {
									block.outputConnection.connect(this.connection);
								}
							}

							for (let i = 0; i < node.arguments.length; i++) {
								this.connection = block.getInput(`PARAM_${i}`)!.connection;
								this.parse(node.arguments[i].expression);
							}

							this.connection = block.nextConnection;
						} else if (node.callee.value === "String") {
							const block = this.block("string");
							this.connection = block.getInput("VALUE")!.connection;
							this.parse(node.arguments[0].expression);
						} else if (node.callee.value === "Number") {
							const block = this.block("number");
							this.connection = block.getInput("VALUE")!.connection;
							this.parse(node.arguments[0].expression);
						} else {
							throw new SyntaxError(
								`Function ${node.callee.value} used before definition`,
							);
						}
					} else {
						throw new SyntaxError("Unsupported function call");
					}
					break;
				}
				case "MemberExpression": {
					if (node.property.type === "PrivateName") {
						throw new SyntaxError("Private fields are not supported");
					}

					if (!SWC.hasSimpleProperty(node)) {
						const block = this.block("item");
						this.connection = block.getInput("INDEX")!.connection;
						this.parse(node.property);

						this.connection = block.getInput("ITERABLE")!.connection;
						this.parse(node.object);
					} else if (SWC.isIdentifier(node.property, "length")) {
						const block = this.block("length");
						this.connection = block.getInput("VALUE")!.connection;
						this.parse(node.object);
					} else if (
						SWC.isIdentifier(node.object, "self") &&
						SWC.isProperty(node, ...properties)
					) {
						this.block(SWC.getPropertyContents(node.property));
					} else if (
						SWC.is(node.object, "MemberExpression") &&
						SWC.isProperty(node.object, "effects")
					) {
						if (SWC.isIdentifier(node.object.object, "self")) {
							const block = this.block("effect");
							block.setFieldValue(
								SWC.getPropertyContents(node.property),
								"EFFECT",
							);
						} else if (
							SWC.is(node.object.object, "MemberExpression") &&
							SWC.isIdentifier(node.object.object.object, "$")
						) {
							if (!SWC.hasSimpleProperty(node.object.object)) {
								throw new SyntaxError(
									"Only simple identifiers and string literals are supported",
								);
							}

							const block = this.block("property");
							block.setFieldValue(
								SWC.getPropertyContents(node.object.object.property),
								"SPRITE",
							);
							block.setFieldValue(
								`effects.${SWC.getPropertyContents(node.property)}`,
								"PROPERTY",
							);
						} else {
							throw new SyntaxError("Unsupported object");
						}
					} else if (SWC.is(node.object, "MemberExpression")) {
						if (SWC.isProperty(node.object, "variables")) {
							if (SWC.isIdentifier(node.object.object, "self")) {
								const block = this.workspace.newBlock("parameter");
								const variable = this.variables.find(
									([name]) => name === SWC.getPropertyContents(node.property),
								);
								block.loadExtraState!({
									isVariable: true,
									type: variable ? variable[1] : "any",
								});
								block.setFieldValue(
									SWC.getPropertyContents(node.property),
									"VAR",
								);
								this.connection?.connect(block.outputConnection!);
							} else if (
								SWC.is(node.object.object, "MemberExpression") &&
								SWC.isIdentifier(node.object.object.object, "$")
							) {
								if (!SWC.hasSimpleProperty(node.object.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}

								const block = this.block("property");
								block.setFieldValue(
									SWC.getPropertyContents(node.object.object.property),
									"SPRITE",
								);
								block.setFieldValue(
									`variables[${JSON.stringify(
										SWC.getPropertyContents(node.property),
									)}]`,
									"PROPERTY",
								);
							} else {
								throw new SyntaxError("Unsupported object");
							}
						} else if (SWC.isProperty(node.object, "costume", "backdrop")) {
							const type = SWC.getPropertyContents(node.object);
							const prop = SWC.getPropertyContents(node.property);
							if (
								type === "backdrop" ||
								SWC.isIdentifier(node.object.object, "self")
							) {
								if (prop === "all") {
									this.block(`${type}.all`);
								} else {
									const block = this.block(type);
									block.setFieldValue(prop, "VALUE");
								}
							} else if (
								SWC.is(node.object.object, "MemberExpression") &&
								SWC.isIdentifier(node.object.object.object, "$")
							) {
								if (!SWC.hasSimpleProperty(node.object.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}
								const block = this.block("property");
								block.setFieldValue(
									SWC.getPropertyContents(node.object.object.property),
									"SPRITE",
								);
								block.setFieldValue(`${type}.${prop}`, "PROPERTY");
							} else {
								throw new SyntaxError("Unsupported object");
							}
						} else if (
							SWC.isProperty(
								node,
								"x",
								"y",
								"size",
								"direction",
								"volume",
								"penSize",
								"penColor",
								"visible",
								"draggable",
							)
						) {
							if (SWC.isIdentifier(node.object.object, "$")) {
								if (!SWC.hasSimpleProperty(node.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}

								const block = this.block("property");
								block.setFieldValue(
									SWC.getPropertyContents(node.object.property),
									"SPRITE",
								);
								block.setFieldValue(
									SWC.getPropertyContents(node.property),
									"PROPERTY",
								);
							} else {
								throw new SyntaxError("Unsupported object");
							}
						}
					} else if (SWC.is(node.object, "Identifier")) {
						if (node.object.value === "$") {
							this.connection?.setShadowState({
								type: "sprite",
								fields: {
									SPRITE: SWC.getPropertyContents(node.property),
								},
							});
						} else if (node.object.value === "Scrap") {
							if (SWC.isProperty(node, "isTurbo")) {
								this.block("isTurbo");
							} else {
								throw new SyntaxError("Unsupported Scrap property");
							}
						} else if (node.object.value === "Math") {
							if (SWC.isProperty(node, "PI", "E")) {
								const block = this.block("constant");
								block.setFieldValue(
									`Math.${SWC.getPropertyContents(node.property)}`,
									"CONSTANT",
								);
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
				case "BinaryExpression": {
					switch (node.operator) {
						case "+":
						case "-":
						case "*":
						case "/":
						case "%":
						case "**": {
							const block = this.block("arithmetics");
							block.setFieldValue(node.operator, "OP");
							this.connection = block.getInput("A")!.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")!.connection;
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
							this.connection = block.getInput("A")!.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")!.connection;
							this.parse(node.right);
							break;
						}
						case "&&":
						case "||": {
							const block = this.block("operation");
							block.setFieldValue(node.operator, "OP");
							this.connection = block.getInput("A")!.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")!.connection;
							this.parse(node.right);
							break;
						}
						default: {
							throw new SyntaxError("Unsupported operator");
						}
					}
					break;
				}
				case "UpdateExpression": {
					const block = this.block("change");

					this.connection = block.getInput("VAR")!.connection!;
					this.connection.setShadowState({type: "x"});
					this.parse(node.argument);

					block.getInput("VALUE")!.connection!.setShadowState({
						type: "math_number",
						fields: {
							NUM: node.operator === "--" ? -1 : 1,
						},
					});

					break;
				}
				case "UnaryExpression": {
					if (node.operator === "!") {
						const block = this.block("not");
						this.connection = block.getInput("BOOL")!.connection;
						this.parse(node.argument);
					} else if (node.operator === "-") {
						if (node.argument.type === "NumericLiteral") {
							const block = this.block("math_number");
							block.setFieldValue(-node.argument.value, "NUM");
						} else {
							const block = this.block("arithmetics");
							block.setFieldValue("-", "OP");
							block.getInput("A")!.connection!.setShadowState({
								type: "math_number",
							});
							this.connection = block.getInput("B")!.connection;
							this.parse(node.argument);
						}
					} else if (node.operator === "+") {
						const block = this.block("number");
						this.connection = block.getInput("VALUE")!.connection;
						this.parse(node.argument);
					} else {
						throw new SyntaxError("Unsupported operator");
					}
					break;
				}
				case "AssignmentExpression": {
					if (
						node.left.type !== "Identifier" &&
						node.left.type !== "MemberExpression"
					) {
						throw new SyntaxError(
							"Only simple identifiers and member expressions are supported",
						);
					}

					switch (node.operator) {
						case "=": {
							var block = this.block("set");
							var argument = node.right;
							break;
						}
						case "+=": {
							var block = this.block("change");
							var argument = node.right;
							break;
						}
						default: {
							var block = this.block("set");
							var argument: SWC.Expression = {
								type: "BinaryExpression",
								operator: node.operator.slice(
									0,
									-1,
								) as SWC.BinaryExpression["operator"],
								left: node.left,
								right: node.right,
								span: {start: 0, end: 0, ctxt: 0},
							};
						}
					}

					this.connection = block.getInput("VAR")!.connection!;
					this.connection.setShadowState({type: "x"});
					this.parse(node.left)!;

					this.connection = block.getInput("VALUE")!.connection;
					this.parse(argument);
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
					block.setFieldValue(id.value, "VAR");

					this.connection = block.getInput("ITERABLE")!.connection;
					this.parse(right);

					this.connection = block.getInput("DO")!.connection;
					this.parse(body);

					this.connection = block.nextConnection;
					break;
				}
				case "Identifier": {
					if (node.value === "self") {
						this.connection?.setShadowState({
							type: "sprite",
						});
					} else if (node.value === "Infinity" || node.value === "NaN") {
						this.block("constant").setFieldValue(node.value, "CONSTANT");
					} else {
						const block = this.workspace.newBlock("parameter");
						block.loadExtraState!({
							isVariable: false,
							type: "any",
						});
						this.connection?.connect(block.outputConnection!);
						block.setFieldValue(node.value, "VAR");
					}
					break;
				}
				case "TsInterfaceDeclaration": {
					if (node.id.value === "Variables") {
						for (const property of node.body.body) {
							if (property.type === "TsPropertySignature") {
								if (
									property.key.type === "StringLiteral" ||
									property.key.type === "Identifier"
								) {
									this.variables.push([
										SWC.getPropertyContents(property.key),
										SWC.getType(property.typeAnnotation?.typeAnnotation),
									]);
								}
							}
						}
						break;
					} else {
						throw new SyntaxError("Only 'Variables' interface is supported");
					}
				}
				case "ParenthesisExpression": {
					this.parse(node.expression);
					break;
				}
				default:
					throw new SyntaxError(
						`Unsupported node type ${
							node.type
						}. Type must be one of void${ScrapTypes.join(", ")}`,
					);
			}
		}
	}
}

declare namespace CodeToBlocks {
	interface Function {
		params: string[];
		name: string;
		returnType: Check | false;
	}
}

export default CodeToBlocks;
