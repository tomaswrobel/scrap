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
 * @fileoverview Typescript → Blockszt
 *
 * This file is responsible for transforming TypeScript code into Blockly
 * blocks. It uses oxc to parse the code and Blockly to generate the
 * blocks. The transformation is done in a way that the blocks are
 * generated in the same order as the code is written. This is done by
 * traversing the AST and creating blocks for each node.
 */
import {entityPropertiesAndMethods, getToolboxShadows} from "@scrap/blockly";
import type {Entity} from "@scrap/types/Enity.svelte";
import type {Check} from "@scrap/types/Check";
import type {Variable} from "@scrap/types/Variable";
import {blockToCheck} from "@scrap/utils/blockToCheck";
import * as OXC from "@scrap/utils/oxc";
import * as Blockly from "blockly/core";
import {ScrapTypes} from "@scrap/blockly/utils/ScrapTypes";
import type {CustomBlock} from "@scrap/utils/CustomBlock";

import ArrayBlock from "@scrap/blockly/blocks/array";
import CallBlock from "@scrap/blockly/blocks/call";
import FunctionBlock from "@scrap/blockly/blocks/function";
import IfBlock from "@scrap/blockly/blocks/controls_if";
import type TryBlock from "@scrap/blockly/blocks/try";
import type ReturnBlock from "@scrap/blockly/blocks/return";
import TypeBlock from "@scrap/blockly/blocks/type";
import UnionBlock from "@scrap/blockly/blocks/union";
import ParameterBlock from "@scrap/blockly/blocks/parameter";
import {assert} from "@juvofy/lib/utils/assert";

type ShadowState = Blockly.serialization.blocks.State;

/** Generic shadows that literals become when no menu shadow fits. */
const genericShadows = ["math_number", "iterables_string", "text_or_number"];

class CodeToBlocks {
	private connection?: Blockly.Connection | null;
	public readonly workspace: Blockly.Workspace;
	private readonly functions = new Map<string, CodeToBlocks.Function>();
	private readonly variables: Variable[] = [];

	private constructor(workspace: Blockly.Workspace) {
		this.workspace = workspace;
	}

	public static async switch(entity: Entity) {
		if (!entity.typescript) {
			return;
		}
		entity.workspace.clear();
		entity.workspace.clearUndo();
		const tree = OXC.parse(entity.typescript);
		const parser = new this(entity.workspace);
		tree.body.forEach(parser.parse, parser);
		entity.variables.splice(0, entity.variables.length, ...parser.variables);
	}

	private block<T>(type: string) {
		const block = this.workspace.newBlock(type);

		if (this.connection) {
			if (block.previousConnection) {
				block.previousConnection.connect(this.connection);
			} else if (block.outputConnection) {
				block.outputConnection.connect(this.connection);
			}
		}

		return block as CustomBlock.Infer<T>;
	}

	private parseArguments(block: Blockly.Block, nodes: OXC.CallExpression["arguments"]) {
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
			this.parse(nodes[i - shift]);
		}

		if (!block.previousConnection && !block.outputConnection) {
			const arg = nodes[i];

			if (arg?.type === "FunctionExpression" || arg?.type === "ArrowFunctionExpression") {
				this.connection = block.nextConnection;
				this.parse(arg.body);
			}

			this.connection = null;
		} else {
			this.connection = block.nextConnection;
		}
	}

	private toolboxShadows(connection = this.connection) {
		const input = connection?.getParentInput();
		return input
			? getToolboxShadows(input.getSourceBlock().type, input.name)
			: new Set<string>();
	}

	/** Turns the block attached to `connection` into a shadow, if it has no inputs. */
	private makeShadow(connection: Blockly.Connection) {
		const target = connection.targetBlock();
		if (
			target &&
			!target.isShadow() &&
			target.inputList.every(input => !input.connection)
		) {
			const {id: _, ...state} = Blockly.serialization.blocks.save(target, {
				addCoordinates: false,
				addNextBlocks: false,
			}) as ShadowState;
			target.dispose(false);
			connection.setShadowState(state);
		}
	}

	private parse(node?: OXC.Node | null): void {
		const {connection} = this;
		this.parseNode(node);
		if (!connection) {
			return;
		}
		// Blocks the toolbox offers as shadows (colors, dates...) stay shadows.
		const type = connection.targetBlock()?.type;
		if (type && this.toolboxShadows(connection).has(type)) {
			this.makeShadow(connection);
		}
	}

	private parseNode(node?: OXC.Node | null): void {
		if (node) {
			switch (node.type) {
				case "TSArrayType": {
					const block = this.block("generic");
					block.setFieldValue("Array", "ITERABLE");
					this.connection = block.getInput("TYPE")?.connection;
					this.parse(node.elementType);
					break;
				}
				case "TSUnionType": {
					const block = this.block<typeof UnionBlock>("union");

					block.loadExtraState({
						count: node.types.length,
					});

					for (let i = 0; i < node.types.length; i++) {
						this.connection = block.getInput(`TYPE${i}`)?.connection;
						this.parse(node.types[i]);
					}

					break;
				}
				case "TSParenthesizedType": {
					this.parse(node.typeAnnotation);
					break;
				}
				case "TSTypeReference": {
					if (node.typeName.type === "Identifier") {
						const {name} = node.typeName;

						if (name === "Array" || name === "Iterable") {
							const block = this.block("generic");
							block.setFieldValue(name, "ITERABLE");
							this.connection = block.getInput("TYPE")?.connection;
							this.parse(node.typeArguments?.params[0]);
						} else if (name === "Date" || name === "Color" || name === "Sprite") {
							const block = this.block("type");
							block.setFieldValue(name, "TYPE");
						} else {
							throw new TypeError(`Unknown type "${name}"`);
						}
					}
					break;
				}
				case "SpreadElement": {
					this.parse(node.argument);
					break;
				}
				case "ExpressionStatement": {
					this.parse(node.expression);
					break;
				}
				case "ConditionalExpression": {
					const block = this.block("ternary");

					this.connection = block.getInput("CONDITION")?.connection;
					this.parse(node.test);

					this.connection = block.getInput("THEN")?.connection;
					this.parse(node.consequent);

					this.connection = block.getInput("ELSE")?.connection;
					this.parse(node.alternate);

					this.connection = null;

					break;
				}
				case "NewExpression": {
					if (OXC.isIdentifier(node.callee, "Date")) {
						if (!node.arguments.length) {
							this.block("today");
						} else if (
							node.arguments.length === 1 &&
							OXC.isString(node.arguments[0])
						) {
							const block = this.block("date");
							block.setFieldValue(node.arguments[0].value, "DATE");
						}
						break;
					} else if (OXC.isIdentifier(node.callee, "Array")) {
						const block = this.block<typeof ArrayBlock>("array");
						block.loadExtraState({
							items: node.arguments?.map(arg => {
								if (arg.type === "SpreadElement") {
									return "iterable";
								} else {
									return "single";
								}
							}),
						});

						this.connection = block.getInput("TYPE")?.connection;
						assert(this.connection);

						this.connection.setShadowState({type: "type"});
						this.parse(node.typeArguments?.params[0]);

						node.arguments?.forEach((arg, i) => {
							this.connection = block.getInput(`ADD${i}`)?.connection;
							this.parse(arg);
						});

						this.connection = block.nextConnection;

						break;
					}
					throw new SyntaxError("Unknown class");
				}
				case "Literal": {
					if (typeof node.value === "number" || typeof node.value === "string") {
						const restored = [...this.toolboxShadows()].some(type => {
							if (genericShadows.includes(type)) {
								return false;
							}
							this.connection?.setShadowState({type});
							const shadow = this.connection?.targetBlock();
							// Only menus of the literal's own type (not e.g. Color from a string)
							if (
								!shadow?.outputConnection
									?.getCheck()
									?.includes(typeof node.value)
							) {
								return false;
							}
							const field = shadow.inputList
								.flatMap(input => input.fieldRow)
								.find(field => field.name);
							// Dropdowns ignore unknown values, then fall back to a generic shadow
							field?.setValue(node.value);
							return field?.getValue() === node.value;
						});
						if (restored) {
							break;
						}
					}

					if (typeof node.value === "number") {
						this.connection?.setShadowState({
							type: "math_number",
							fields: {
								NUM: node.value,
							},
						});
					} else if (typeof node.value === "string") {
						this.connection?.setShadowState({
							type: "iterables_string",
							fields: {
								TEXT: node.value,
							},
						});
					} else if (typeof node.value === "boolean") {
						this.block("boolean").setFieldValue(node.value.toString(), "BOOL");
					} else if (node.value !== null) {
						throw new SyntaxError("Unsupported literal");
					}
					break;
				}
				case "ReturnStatement": {
					const block = this.block<typeof ReturnBlock>("return");

					if (node.argument) {
						block.loadExtraState({output: "any"});
						this.connection = block.getInput("VALUE")?.connection;
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
					this.connection = block.getInput("ERROR")?.connection;
					this.parse(node.argument);
					this.connection = null;
					break;
				}
				case "BlockStatement":
					node.body.forEach(this.parse, this);
					break;
				case "VariableDeclaration": {
					for (let i = 0; i < node.declarations.length; i++) {
						const {id, init} = node.declarations[i];
						const block = this.block("variable");

						block.setFieldValue(node.kind, "kind");

						if (id.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						this.connection = block.getInput("VAR")?.connection;
						const typed = this.block("typed");
						this.connection = typed.getInput("TYPE")?.connection;
						if (id.typeAnnotation) {
							typed.setFieldValue(
								`${id.name}:${OXC.getType(id.typeAnnotation.typeAnnotation)}`,
								"PARAM",
							);
							this.parse(id.typeAnnotation.typeAnnotation);
							this.connection?.targetBlock()?.setShadow(true);
						} else {
							this.connection?.setShadowState({
								type: "type",
							});
							typed.setFieldValue(id.name, "PARAM");
						}

						this.connection = block.getInput("VALUE")?.connection;
						this.parse(init);

						this.connection = block.nextConnection;
					}
					break;
				}
				case "TryStatement": {
					const block = this.block<typeof TryBlock>("tryCatch");

					this.connection = block.getInput("TRY")?.connection;
					this.parse(node.block);

					if (node.handler && node.finalizer) {
						const {param, body} = node.handler;

						if (param && param.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						block.loadExtraState({
							catch: param ? param.name : true,
							finally: true,
						});

						this.connection = block.getInput("CATCH")?.connection;
						this.parse(body);

						this.connection = block.getInput("FINALLY")?.connection;
						this.parse(node.finalizer);
					} else if (node.handler) {
						const {param, body} = node.handler;

						if (param && param.type !== "Identifier") {
							throw new SyntaxError("Only simple identifiers are supported");
						}

						block.loadExtraState({
							catch: param ? param.name : true,
							finally: false,
						});

						this.connection = block.getInput("CATCH")?.connection;
						this.parse(body);
					} else if (node.finalizer) {
						block.loadExtraState({
							finally: true,
							catch: false,
						});

						this.connection = block.getInput("FINALLY")?.connection;
						this.parse(node.finalizer);
					}

					this.connection = block.nextConnection;

					break;
				}
				case "IfStatement": {
					const block = this.block<typeof IfBlock>("controls_if");
					this.connection = block.getInput("IF0")?.connection;
					this.parse(node.test);

					this.connection = block.getInput("DO0")?.connection;
					this.parse(node.consequent);

					const elseIfStatements: OXC.IfStatement[] = [];
					let {alternate} = node;

					while (alternate?.type === "IfStatement") {
						elseIfStatements.push(alternate);
						({alternate} = alternate);
					}

					block.loadExtraState({
						elseIfCount: elseIfStatements.length,
						hasElse: !!alternate,
					});

					for (let i = 0; i < elseIfStatements.length; i++) {
						this.connection = block.getInput(`IF${i + 1}`)?.connection;
						this.parse(elseIfStatements[i].test);

						this.connection = block.getInput(`DO${i + 1}`)?.connection;
						this.parse(elseIfStatements[i].consequent);
					}

					if (alternate) {
						this.connection = block.getInput("ELSE")?.connection;
						this.parse(alternate);
					}

					this.connection = block.nextConnection;

					break;
				}
				case "WhileStatement": {
					const block = this.block("while");

					this.connection = block.getInput("CONDITION")?.connection;
					this.parse(node.test);

					this.connection = block.getInput("STACK")?.connection;
					this.parse(node.body);

					this.connection = block.nextConnection;

					break;
				}
				case "DoWhileStatement": {
					const block = this.block("doWhile");

					this.connection = block.getInput("STACK")?.connection;
					this.parse(node.body);

					this.connection = block.getInput("CONDITION")?.connection;
					this.parse(node.test);

					this.connection = block.nextConnection;

					break;
				}
				case "ForStatement": {
					const {init, update, test, body} = node;

					if (!init && !update && !test) {
						// while true
						const block = this.block("while");
						this.connection = block.getInput("CONDITION")?.connection;
						this.block("boolean");

						this.connection = block.getInput("STACK")?.connection;
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

							const [{id, init: dec}] = init.declarations;

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

							if (test.left.name !== id.name) {
								throw new SyntaxError(
									"Only for loops with the same variable in init and test are supported",
								);
							}

							if (update.argument.type !== "Identifier") {
								throw new SyntaxError("Only simple identifiers are supported");
							}

							if (update.argument.name !== id.name) {
								throw new SyntaxError(
									"Only for loops with the same variable in init and update are supported",
								);
							}

							const block = this.block("for");
							block.setFieldValue(`${id.name}:number`, "VAR");

							this.connection = block.getInput("TO")?.connection;
							this.parse(test.right);

							this.connection = block.getInput("FROM")?.connection;
							this.parse(dec);

							this.connection = block.getInput("STACK")?.connection;
							this.parse(body);

							this.connection = block.nextConnection;
						} catch {
							// Convert to "while" block
							this.parse(node.init);

							const block = this.block("while");

							this.connection = block.getInput("CONDITION")?.connection;
							this.parse(node.test);

							this.connection = block.getInput("STACK")?.connection;
							this.parse(node.body);

							this.connection = block.nextConnection;
							this.parse(node.update);
						}
					}

					break;
				}
				case "FunctionDeclaration": {
					const params: string[] = [];

					const block = this.block<typeof FunctionBlock>("function");
					assert(node.id);
					const {name} = node.id;
					block.setFieldValue(name, "NAME");

					const types = new Array<OXC.TSType | null>();

					for (const param of node.params) {
						if (param.type !== "Identifier") {
							continue;
						}

						params.push(param.name);

						types.push(param.typeAnnotation?.typeAnnotation ?? null);
					}

					block.loadExtraState({
						params,
						returns:
							!!node.returnType &&
							node.returnType.typeAnnotation.type !== "TSVoidKeyword",
					});

					types.forEach((type, i) => {
						this.connection = block
							.getInput(`PARAM_${i}`)
							?.connection?.targetBlock()
							?.getInput("TYPE")?.connection;

						this.parse(type);
					});

					if ((this.connection = block.getInput("RETURNS")?.connection)) {
						assert(
							node.returnType,
							"[function] Mutator set return type, while there's none.",
						);
						this.parse(node.returnType.typeAnnotation);

						this.functions.set(name, {
							params,
							name,
							returnType: blockToCheck(this.connection.targetBlock()),
						});
					} else {
						this.functions.set(name, {
							params,
							name,
							returnType: false,
						});
					}

					this.connection = block.nextConnection;
					this.parse(node.body);

					this.connection = null;

					break;
				}
				case "ArrayExpression": {
					const block = this.block<typeof ArrayBlock>("array");

					this.connection = block.getInput("TYPE")?.connection;
					assert(this.connection);

					this.connection.setShadowState({type: "type"});

					block.loadExtraState({
						items: node.elements.map(element => {
							if (element?.type === "SpreadElement") {
								return "iterable";
							} else {
								return "single";
							}
						}),
					});

					node.elements.forEach((element, i) => {
						this.connection = block.getInput(`ADD${i}`)?.connection;
						this.parse(element);
					});

					this.connection = null;

					break;
				}
				case "CallExpression": {
					if (node.callee.type === "MemberExpression") {
						if (
							OXC.isIdentifier(node.callee.object, "window") &&
							OXC.isProperty(node.callee, "alert", "prompt", "confirm")
						) {
							const block = this.block(
								OXC.getPropertyContents(node.callee.property),
							);
							this.connection = block.getInput("TEXT")?.connection;
							this.parse(node.arguments[0]);
							this.connection = block.nextConnection;
						} else if (
							OXC.isIdentifier(node.callee.object, "Scrap") &&
							OXC.isProperty(node.callee, "isTurbo")
						) {
							this.block("isTurbo");
						} else if (OXC.isIdentifier(node.callee.object, "Color")) {
							if (OXC.isProperty(node.callee, "fromHex")) {
								const block = this.block("color");
								if (OXC.isString(node.arguments[0])) {
									block.setFieldValue(node.arguments[0].value, "COLOR");
								} else {
									throw new SyntaxError("Only string literals are supported");
								}
							} else if (OXC.isProperty(node.callee, "fromRGB")) {
								const block = this.block("rgb");
								this.connection = block.getInput("RED")?.connection;
								this.parse(node.arguments[0]);
								this.connection = block.getInput("GREEN")?.connection;
								this.parse(node.arguments[1]);
								this.connection = block.getInput("BLUE")?.connection;
								this.parse(node.arguments[2]);
							} else if (OXC.isProperty(node.callee, "random")) {
								this.block("color_random");
							}
						} else if (
							OXC.isIdentifier(node.callee.object, "Scrap") &&
							OXC.isProperty(node.callee, "stop")
						) {
							this.block("stop");
							this.connection = null;
						} else if (OXC.isProperty(node.callee, "getTime", "valueOf")) {
							const block = this.block("number");
							this.connection = block.getInput("VALUE")?.connection;
							this.parse(node.callee.object);
						} else if (OXC.isProperty(node.callee, "toString")) {
							const block = this.block("string");
							this.connection = block.getInput("VALUE")?.connection;
							this.parse(node.callee.object);
						} else if (OXC.isProperty(node.callee, "clone")) {
							const block = this.block("clone");
							this.connection = block.getInput("SPRITE")?.connection;
							this.parse(node.callee.object);
							this.connection = block.nextConnection;
						} else if (
							OXC.isProperty(
								node.callee,
								"reverse",
								"includes",
								"indexOf",
								"slice",
							)
						) {
							const block = this.block(
								OXC.getPropertyContents(node.callee.property),
							);
							this.connection = block.getInput("ITERABLE")?.connection;
							this.parse(node.callee.object);
							this.parseArguments(block, node.arguments);
						} else if (OXC.isProperty(node.callee, "join")) {
							const block = this.block("join");
							this.connection = block.getInput("ITERABLE")?.connection;
							this.parse(node.callee.object);
							this.connection = block.getInput("SEPARATOR")?.connection;
							this.parse(node.arguments[0]);
						} else if (
							OXC.isProperty(
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
								OXC.getPropertyContents(node.callee.property),
								"PROPERTY",
							);
							this.connection = block.getInput("DATE")?.connection;
							this.parse(node.callee.object);
						} else if (
							OXC.isIdentifier(node.callee.object, "self") &&
							OXC.isProperty(node.callee, ...entityPropertiesAndMethods)
						) {
							const block = this.block(
								OXC.getPropertyContents(node.callee.property),
							);
							this.parseArguments(block, node.arguments);
						} else if (OXC.isIdentifier(node.callee.object, "Math")) {
							if (
								OXC.isProperty(
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
									OXC.getPropertyContents(node.callee.property),
									"OP",
								);
								this.connection = block.getInput("NUM")?.connection;
								this.parse(node.arguments[0]);
							} else if (OXC.isProperty(node.callee, "random")) {
								this.block("random");
							} else {
								throw new SyntaxError("Unsupported Math function");
							}
						} else {
							throw new SyntaxError("Unsupported function call");
						}
					} else if (node.callee.type === "Identifier") {
						if (this.functions.has(node.callee.name)) {
							const block = CallBlock.createIn(this.workspace);
							block.setFieldValue(node.callee.name, "NAME");
							block.loadExtraState(this.functions.get(node.callee.name));

							if (this.connection) {
								if (block.previousConnection) {
									block.previousConnection.connect(this.connection);
								} else if (block.outputConnection) {
									block.outputConnection.connect(this.connection);
								}
							}

							for (let i = 0; i < node.arguments.length; i++) {
								this.connection = block.getInput(`PARAM_${i}`)?.connection;
								this.parse(node.arguments[i]);
							}

							this.connection = block.nextConnection;
						} else if (node.callee.name === "String") {
							const block = this.block("string");
							this.connection = block.getInput("VALUE")?.connection;
							this.parse(node.arguments[0]);
						} else if (node.callee.name === "Number") {
							const block = this.block("number");
							this.connection = block.getInput("VALUE")?.connection;
							this.parse(node.arguments[0]);
						} else {
							throw new SyntaxError(
								`Function ${node.callee.name} used before definition`,
							);
						}
					} else {
						throw new SyntaxError("Unsupported function call");
					}
					break;
				}
				case "MemberExpression": {
					if (node.property.type === "PrivateIdentifier") {
						throw new SyntaxError("Private fields are not supported");
					}

					if (!OXC.hasSimpleProperty(node)) {
						const block = this.block("item");
						this.connection = block.getInput("INDEX")?.connection;
						this.parse(node.property);

						this.connection = block.getInput("ITERABLE")?.connection;
						this.parse(node.object);
					} else if (OXC.isIdentifier(node.property, "length")) {
						const block = this.block("length");
						this.connection = block.getInput("ITERABLE")?.connection;
						this.parse(node.object);
					} else if (
						OXC.isIdentifier(node.object, "self") &&
						OXC.isProperty(node, ...entityPropertiesAndMethods)
					) {
						this.block(OXC.getPropertyContents(node.property));
					} else if (
						OXC.is(node.object, "MemberExpression") &&
						OXC.isProperty(node.object, "effects")
					) {
						if (OXC.isIdentifier(node.object.object, "self")) {
							const block = this.block("effect");
							block.setFieldValue(
								OXC.getPropertyContents(node.property),
								"EFFECT",
							);
						} else if (
							OXC.is(node.object.object, "MemberExpression") &&
							OXC.isIdentifier(node.object.object.object, "$")
						) {
							if (!OXC.hasSimpleProperty(node.object.object)) {
								throw new SyntaxError(
									"Only simple identifiers and string literals are supported",
								);
							}

							const block = this.block("property");
							block.setFieldValue(
								OXC.getPropertyContents(node.object.object.property),
								"SPRITE",
							);
							block.setFieldValue(
								`effects.${OXC.getPropertyContents(node.property)}`,
								"PROPERTY",
							);
						} else {
							throw new SyntaxError("Unsupported object");
						}
					} else if (OXC.is(node.object, "MemberExpression")) {
						if (OXC.isProperty(node.object, "variables")) {
							if (OXC.isIdentifier(node.object.object, "self")) {
								const block = ParameterBlock.createIn(this.workspace);
								const variable = this.variables.find(
									([name]) => name === OXC.getPropertyContents(node.property),
								);
								block.loadExtraState({
									isVariable: true,
									type: variable ? variable[1] : "any",
								});
								block.setFieldValue(
									OXC.getPropertyContents(node.property),
									"VAR",
								);
								this.connection?.connect(block.outputConnection);
							} else if (
								OXC.is(node.object.object, "MemberExpression") &&
								OXC.isIdentifier(node.object.object.object, "$")
							) {
								if (!OXC.hasSimpleProperty(node.object.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}

								const block = this.block("property");
								block.setFieldValue(
									OXC.getPropertyContents(node.object.object.property),
									"SPRITE",
								);
								block.setFieldValue(
									`variables[${JSON.stringify(
										OXC.getPropertyContents(node.property),
									)}]`,
									"PROPERTY",
								);
							} else {
								throw new SyntaxError("Unsupported object");
							}
						} else if (OXC.isProperty(node.object, "costume", "backdrop")) {
							const type = OXC.getPropertyContents(node.object.property);
							const prop = OXC.getPropertyContents(node.property);
							if (
								type === "backdrop" ||
								OXC.isIdentifier(node.object.object, "self")
							) {
								if (prop === "all") {
									this.block(`${type}.all`);
								} else {
									const block = this.block(type);
									block.setFieldValue(prop, "VALUE");
								}
							} else if (
								OXC.is(node.object.object, "MemberExpression") &&
								OXC.isIdentifier(node.object.object.object, "$")
							) {
								if (!OXC.hasSimpleProperty(node.object.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}
								const block = this.block("property");
								block.setFieldValue(
									OXC.getPropertyContents(node.object.object.property),
									"SPRITE",
								);
								block.setFieldValue(`${type}.${prop}`, "PROPERTY");
							} else {
								throw new SyntaxError("Unsupported object");
							}
						} else if (
							OXC.isProperty(
								node,
								"x",
								"y",
								"size",
								"direction",
								"volume",
								"width",
								"height",
								"penSize",
								"penColor",
								"visible",
								"draggable",
							)
						) {
							if (OXC.isIdentifier(node.object.object, "$")) {
								if (!OXC.hasSimpleProperty(node.object)) {
									throw new SyntaxError(
										"Only simple identifiers and string literals are supported",
									);
								}

								const block = this.block("property");
								block.setFieldValue(
									OXC.getPropertyContents(node.object.property),
									"SPRITE",
								);
								block.setFieldValue(
									OXC.getPropertyContents(node.property),
									"PROPERTY",
								);
							} else {
								throw new SyntaxError("Unsupported object");
							}
						} else {
							throw new SyntaxError("Unsupported sprite property");
						}
					} else if (OXC.is(node.object, "Identifier")) {
						if (node.object.name === "$") {
							this.connection?.setShadowState({
								type: "sprite",
								fields: {
									SPRITE: OXC.getPropertyContents(node.property),
								},
							});
						} else if (node.object.name === "Scrap") {
							if (OXC.isProperty(node, "isTurbo")) {
								this.block("isTurbo");
							} else {
								throw new SyntaxError("Unsupported Scrap property");
							}
						} else if (node.object.name === "Math") {
							if (OXC.isProperty(node, "PI", "E")) {
								const block = this.block("constant");
								block.setFieldValue(
									`Math.${OXC.getPropertyContents(node.property)}`,
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
				case "LogicalExpression":
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
							this.connection = block.getInput("A")?.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")?.connection;
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
							this.connection = block.getInput("A")?.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")?.connection;
							this.parse(node.right);
							break;
						}
						case "&&":
						case "||": {
							const block = this.block("operation");
							block.setFieldValue(node.operator, "OP");
							this.connection = block.getInput("A")?.connection;
							this.parse(node.left);
							this.connection = block.getInput("B")?.connection;
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

					const variable = block.getInput("VAR")?.connection;
					assert(variable);

					variable.setShadowState({type: "x"});
					this.connection = variable;
					this.parse(node.argument);
					this.makeShadow(variable);

					block.getInput("VALUE")?.connection?.setShadowState({
						type: "math_number",
						fields: {
							NUM: node.operator === "--" ? -1 : 1,
						},
					});

					this.connection = block.nextConnection;
					break;
				}
				case "UnaryExpression": {
					if (node.operator === "!") {
						const block = this.block("not");
						this.connection = block.getInput("BOOL")?.connection;
						this.parse(node.argument);
					} else if (node.operator === "-") {
						if (
							node.argument.type === "Literal" &&
							typeof node.argument.value === "number"
						) {
							const block = this.block("math_number");
							block.setFieldValue(-node.argument.value, "NUM");
						} else {
							const block = this.block("arithmetics");
							block.setFieldValue("-", "OP");
							block.getInput("A")?.connection?.setShadowState({
								type: "math_number",
							});
							this.connection = block.getInput("B")?.connection;
							this.parse(node.argument);
						}
					} else if (node.operator === "+") {
						const block = this.block("number");
						this.connection = block.getInput("VALUE")?.connection;
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

					let block: Blockly.Block, argument: OXC.Expression;

					switch (node.operator) {
						case "=": {
							block = this.block("set");
							argument = node.right;
							break;
						}
						case "+=": {
							block = this.block("change");
							argument = node.right;
							break;
						}
						default: {
							block = this.block("set");
							argument = {
								type: "BinaryExpression",
								operator: node.operator.slice(0, -1) as OXC.BinaryOperator,
								left: node.left,
								right: node.right,
								start: 0,
								end: 0,
							};
						}
					}

					const variable = block.getInput("VAR")?.connection;
					assert(variable);

					variable.setShadowState({type: "x"});
					this.connection = variable;
					this.parse(node.left);
					this.makeShadow(variable);

					this.connection = block.getInput("VALUE")?.connection;
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
					block.setFieldValue(id.name, "VAR");

					this.connection = block.getInput("ITERABLE")?.connection;
					this.parse(right);

					this.connection = block.getInput("DO")?.connection;
					this.parse(body);

					this.connection = block.nextConnection;
					break;
				}
				case "Identifier": {
					if (node.name === "self") {
						this.connection?.setShadowState({
							type: "sprite",
						});
					} else if (node.name === "Infinity" || node.name === "NaN") {
						this.block("constant").setFieldValue(node.name, "CONSTANT");
					} else {
						const block = ParameterBlock.createIn(this.workspace);
						block.loadExtraState({
							isVariable: false,
							type: "any",
						});
						this.connection?.connect(block.outputConnection);
						block.setFieldValue(node.name, "VAR");
					}
					break;
				}
				case "TSInterfaceDeclaration": {
					if (node.id.name === "Variables") {
						for (const property of node.body.body) {
							if (property.type === "TSPropertySignature") {
								if (
									!property.computed &&
									OXC.getPropertyContents(property.key)
								) {
									this.variables.push([
										OXC.getPropertyContents(property.key),
										OXC.getType(property.typeAnnotation?.typeAnnotation),
									]);
								}
							}
						}
						break;
					} else {
						throw new SyntaxError("Only 'Variables' interface is supported");
					}
				}
				case "ParenthesizedExpression": {
					this.parse(node.expression);
					break;
				}
				default: {
					const keyword = OXC.getKeyword(node);

					if (!keyword) {
						throw new SyntaxError(
							`Unsupported node type ${
								node.type
							}. Type must be one of void${ScrapTypes.join(", ")}`,
						);
					}

					const block = this.block<typeof TypeBlock>("type");
					block.setFieldValue(keyword, "TYPE");
					this.connection?.setShadowState({type: "type"});
				}
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
