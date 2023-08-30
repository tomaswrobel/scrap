import * as Blockly from "scrap-blocks";
import Component from "../tab";
import type {SyntaxNode} from "@lezer/common";
import {type Entity} from "../entities";
import {EditorState} from "@codemirror/state";
import {keymap} from "@codemirror/view";
import {EditorView, basicSetup} from "codemirror";
import {LanguageSupport, syntaxTree} from "@codemirror/language";
import {typescriptLanguage} from "@codemirror/lang-javascript";
import {defaultKeymap} from "@codemirror/commands";
import {linter, Diagnostic} from "@codemirror/lint";
import {parser} from "./js.grammar";
import type {App} from "../app";

const generator = new Blockly.Scrap.Generator();
const typescript = new LanguageSupport(typescriptLanguage);

const Unsupported = {
	RegExp: "Regular expressions are not supported.",
	TemplateLiteral: "Template literals are not supported.",
	TaggedTemplateExpression: "Tagged template expressions are not supported.",
	NewExpression: "New expressions are not supported.",
	ArrowFunctionExpression: "Arrow functions are not supported.",
	AssignmentPattern: "Assignment patterns are not supported.",
	SpreadElement: "Spread elements are not supported.",
	ExportNamedDeclaration: "Export declarations are not supported.",
	ExportDefaultDeclaration: "Export declarations are not supported.",
	ExportAllDeclaration: "Export declarations are not supported.",
	ExportSpecifier: "Export specifiers are not supported.",
	ImportSpecifier: "Import specifiers are not supported.",
	ImportDefaultSpecifier: "Import specifiers are not supported.",
	ImportNamespaceSpecifier: "Import specifiers are not supported.",
	ClassDeclaration: "Classes are not supported.",
	ClassExpression: "Classes are not supported.",
	ForInStatement: "For in statements are not supported.",
	LiteralTye: "Literal types are not supported.",
	IntersectionType: "Intersection types are not supported.",
	UnionType: "Union types are not supported.",
	ConditionalType: "Conditional types are not supported.",
	IndexedAccessType: "Indexed access types are not supported.",
	ArrayPattern: "Desctructuring is not supported.",
	ObjectPattern: "Desctructuring is not supported.",
};

const types = ["void", "Number", "String", "Boolean", "Color", "Array", "Sprite"];
const unsupportedLint = linter(view => {
	const diagnostics: Diagnostic[] = [];

	function content(node: SyntaxNode) {
		return view.state.sliceDoc(node.from, node.to);
	}

	syntaxTree(view.state)
		.cursor()
		.iterate(({node}) => {
			if (node.name === "TypeName") {
				if (types.indexOf(content(node)) === -1) {
					diagnostics.push({
						from: node.from,
						to: node.to,
						message: `This type is not supported. Type must be: ${types.join(", ")}.`,
						severity: "error",
					});
				}
			}
			if (node.name === "ImportDeclaration") {
				const from = content(node.getChild("String")!);

				if (from !== '"scrap-engine"') {
					diagnostics.push({
						from: node.from,
						to: node.to,
						message: 'Only imports from "scrap-engine" are supported.',
						severity: "error",
					});
				}
			}
			if (node.name === "ForStatement") {
				const forInSpec = node.getChild("ForInSpec");
				if (forInSpec) {
					const inPos = forInSpec.getChild("in")!;

					diagnostics.push({
						from: forInSpec.from,
						to: forInSpec.to,
						message: "For in statements are not supported. Did you mean `for of`?",
						severity: "error",
						actions: [
							{
								name: "Convert to for of",
								apply(view) {
									view.dispatch({
										changes: {
											from: inPos.from,
											to: inPos.to,
											insert: "of",
										},
									});
								},
							},
						],
					});
				}

				const spec = node.getChild("ForSpec");
				if (spec) {
					const declaration = spec.getChild("VariableDeclaration");

					if (!spec.getChild("Expression") && !declaration) {
						return;
					}

					if (declaration) {
						const firstChild = declaration.firstChild!;
						if (content(firstChild) !== "let") {
							diagnostics.push({
								from: firstChild.from,
								to: firstChild.to,
								message: "For  statement must declare variable with `let`.",
								severity: "error",
								actions: [
									{
										name: "Convert to let",
										apply(view, from, to) {
											view.dispatch({
												changes: {from, to, insert: "let"},
											});
										},
									},
								],
							});
						}
					} else {
						const declaration = spec.getChild("Expression")!;
						diagnostics.push({
							from: declaration.from,
							to: declaration.to,
							message: "For statement must declare variable",
							severity: "error",
						});
					}
				}
			}
			if (node.name in Unsupported) {
				diagnostics.push({
					from: node.from,
					to: node.to,
					message: Unsupported[node.name as keyof typeof Unsupported],
					severity: "error",
					actions: [
						{
							name: "Remove",
							apply(view, from, to) {
								view.dispatch({changes: {from, to}});
							},
						},
					],
				});
			}
		});
	return diagnostics;
});

export default class Code implements Component {
	container = document.createElement("div");
	view?: EditorView;
	entity!: Entity;

	constructor(readonly app: App) {
		this.container.classList.add("tab-content");
	}

	render(entity: Entity, parent: HTMLElement) {
		this.view = new EditorView({
			parent: this.container,
		});

		this.update(entity);
		parent.appendChild(this.container);
	}

	update(entity: Entity): void {
		this.entity = entity;

		this.view!.setState(
			EditorState.create({
				doc: generator.workspaceToCode(entity.codeWorkspace),
				extensions: [basicSetup, unsupportedLint, typescript, keymap.of(defaultKeymap)],
			})
		);
	}

	dispose() {
		try {
			const app = this.app;
			const code = this.view!.state.doc.toString();
			const workspace = this.entity.codeWorkspace;
			workspace.clear();

			let connection: Blockly.Connection | null = null;

			function newBlock<T = {}>(type: string) {
				const block = workspace.newBlock(type);

				if (connection) {
					if (block.outputConnection) {
						connection.connect(block.outputConnection);
					} else if (block.previousConnection) {
						connection.connect(block.previousConnection);
					}
				}

				return block as Blockly.Block & T;
			}

			function numberShadow(ex?: SyntaxNode) {
				const block = newBlock("math_number");
				block.setShadow(true);

				if (ex?.firstChild?.name === "Number") {
					block.setFieldValue(getContent(ex.firstChild), "NUM");
				}
			}

			function getContent(node: SyntaxNode) {
				return code.slice(node.from, node.to);
			}

			function parse(node: SyntaxNode) {
				switch (node.name) {
					case "Statement":
					case "Expression":
					case "BinaryExpression":
						parse(node.firstChild!);
						break;
					case "RandomFraction": {
						newBlock("random");
						break;
					}
					case "IterableMethod": {
						connection = newBlock(getContent(node.getChild("MethodName")!)).getInput(
							"ITERABLE"
						)!.connection;
						parse(node.getChild("Expression")!);
						break;
					}
					case "FunctionCall": {
						const args = node.getChild("ArgumentList")!.getChildren("Expression");
						const name = getContent(node.getChild("Identifier")!);
						const block = newBlock("call");

						let returnType: string | null = "";

						if (connection) {
							if (connection.type === Blockly.ConnectionType.INPUT_VALUE) {
								returnType = null;
							}
							if (connection.type === Blockly.ConnectionType.OUTPUT_VALUE) {
								returnType = null;
							}
						}

						block.loadExtraState!({
							name,
							returnType,
							params: args.map(() => ({type: ""})),
						});

						args.forEach((arg, i) => {
							const input = block.getInput(`ARG${i}`)!;
							connection = input.connection;
							parse(arg);
						});

						connection = block.nextConnection;
						break;
					}
					case "ThrowStatement":
						connection = newBlock("throw").getInput("ERROR")!.connection;
						parse(node.getChild("Expression")!);
						connection = null;
						break;
					case "ReturnStatement": {
						const block = newBlock<{addValue(type: null): void}>("return");
						const expression = node.getChild("Expression");

						if (expression) {
							const input = block.getInput("VALUE")!;

							if (!input) {
								block.addValue(null);
							}

							connection = block.getInput("VALUE")!.connection;
							parse(expression);
						}

						connection = null;
						break;
					}
					case "ArrayExpression": {
						const block = newBlock("array");

						block.loadExtraState!({
							items: node
								.getChildren("ArrayItem")
								.map(item => (item.getChild("Spread") ? "iterable" : "single")),
						});

						node.getChildren("ArrayItem").forEach((item, i) => {
							const child = item.getChild("Expression")!;
							const input = block.getInput(`ADD${i}`)!;

							connection = input.connection;
							parse(child);
						});

						break;
					}
					case "FunctionDeclaration": {
						const block = newBlock("function");
						const name = getContent(node.getChild("Identifier")!);
						const returnType = node.getChild("Type") || "";
						const args = node.getChild("ParameterList")!;

						const params = args.getChildren("Parameter").map(arg => {
							const type = arg.getChild("Type");
							return {
								name: getContent(arg.getChild("Identifier")!),
								type: type ? getContent(type) : "",
							};
						});

						block.loadExtraState!({
							name,
							returnType: returnType && getContent(returnType),
							params,
						});

						connection = block.nextConnection;
						parse(node.getChild("Block")!);
						break;
					}
					case "TryStatement": {
						const block = newBlock("tryCatch");

						// Error paramater
						block.setFieldValue(getContent(node.getChild("Identifier")!), "ERROR");

						// Try / Catch blocks
						const [try0, catch0] = node.getChildren("Block");

						connection = block.getInput("TRY")!.connection;
						parse(try0);

						connection = block.getInput("CATCH")!.connection;
						parse(catch0);

						break;
					}
					case "FunctionArgument":
						parse(node.getChild("Block")!);
						break;
					case "Program":
					case "Block":
						node.getChildren("Statement").forEach(parse);
						break;
					case "VariableDefinition": {
						const varName = getContent(node.getChild("Identifier")!);

						if (!workspace.getVariable(varName)) {
							workspace.createVariable(varName);
						}
						break;
					}
					case "MethodCall": {
						const method = getContent(node.getChild("Identifier")!);
						const block = newBlock(method);
						const inputs = block.inputList.filter(input => input.type === Blockly.inputTypes.VALUE);

						node.getChild("ArgumentList")!
							.getChildren("Expression")
							.forEach((expression, i) => {
								const input = inputs[i];

								if (input) {
									connection = input.connection;
									parse(expression);
									return;
								} else if (!block.previousConnection) {
									connection = block.nextConnection;
									const child = expression.getChild("FunctionArgument");

									if (child) {
										parse(child);
										return;
									}
								}

								throw new Error("Invalid method call");
							});
						connection = block.nextConnection;
						break;
					}
					case "Number": {
						numberShadow();
						break;
					}
					case "String": {
						const block = newBlock("iterables_string");
						block.setFieldValue(JSON.parse(getContent(node)), "TEXT");
						block.setShadow(true);
						break;
					}
					case "Boolean": {
						const block = newBlock("boolean");
						block.setFieldValue(getContent(node), "BOOL");
						block.setShadow(true);
						break;
					}
					case "This": {
						newBlock("sprite").setShadow(true);
						break;
					}
					case "Property": {
						newBlock(getContent(node.getChild("Identifier")!));
						break;
					}
					case "IfStatement": {
						const block = newBlock("controls_if");
						const if0 = node.getChild("If")!;
						const elseIf = node.getChildren("ElseIf");
						const else0 = node.getChild("Else");

						block.loadExtraState!({
							elseIfCount: elseIf.length,
							hasElse: !!else0,
						});

						[if0, ...elseIf].forEach((elseIf, i) => {
							connection = block.getInput(`IF${i}`)!.connection;
							parse(elseIf.getChild("Expression")!);
							connection = block.getInput(`DO${i}`)!.connection;
							parse(elseIf.getChild("Block")!);
						});

						if (else0) {
							connection = block.getInput("ELSE")!.connection;
							parse(else0.getChild("Block")!);
						}

						connection = block.nextConnection;
						break;
					}
					case "WhileStatement": {
						const block = newBlock("while");
						connection = block.getInput("CONDITION")!.connection;
						parse(node.getChild("Expression")!);
						connection = block.getInput("STACK")!.connection;
						parse(node.getChild("Block")!);
						connection = block.nextConnection;
						break;
					}
					case "ForOfStatement": {
						const block = newBlock("foreach");
						block.setFieldValue(getContent(node.getChild("Identifier")!), "VAR");

						connection = block.getInput("ITERABLE")!.connection;
						parse(node.getChild("Expression")!);

						connection = block.getInput("DO")!.connection;
						parse(node.getChild("Block")!);

						connection = block.nextConnection;
						break;
					}
					case "EmptyForStatement": {
						const block = newBlock("while");
						const trueBlock = newBlock("boolean");
						trueBlock.setFieldValue("true", "BOOL");
						trueBlock.outputConnection!.connect(block.getInput("CONDITION")!.connection!);
						connection = block.getInput("STACK")!.connection;
						parse(node.getChild("Block")!);
						connection = block.nextConnection;
						break;
					}
					case "ForStatement": {
						const block = newBlock("repeat");
						connection = block.getInput("TIMES")!.connection;
						numberShadow(node.getChild("Expression")!);
						connection = block.getInput("STACK")!.connection;
						parse(node.getChild("Block")!);
						connection = block.nextConnection;
						break;
					}
					case "BreakStatement": {
						newBlock("break");
						connection = null;
						break;
					}
					case "ContinueStatement": {
						newBlock("continue");
						connection = null;
						break;
					}
					case "Assignment": {
						const variable = getContent(node.getChild("Identifier")!);
						const model = workspace.getVariable(variable) || workspace.createVariable(variable);

						const block = newBlock("variables_set");
						connection = block.getInput("VALUE")!.connection;
						parse(node.getChild("Expression")!);
						block.setFieldValue(model.getId(), "VAR");
						break;
					}
					case "Identifier": {
						const content = getContent(node);

						if (app.entities.some(entity => entity.name === content)) {
							const block = newBlock("sprite");
							block.setFieldValue(content, "SPRITE");
							block.setShadow(true);
						} else {
							const block = newBlock("parameter");
							block.setFieldValue(content, "VAR");
						}
						break;
					}
					case "Arithmetics":
					case "Compare":
					case "Operation": {
						const [Left, Right] = node.getChildren("Expression");
						const block = newBlock(node.name.toLowerCase());

						block.setFieldValue(getContent(node.getChild("Operator")!), "OP");

						connection = block.getInput("A")!.connection;
						numberShadow(Left);

						connection = block.getInput("B")!.connection;
						numberShadow(Right);

						break;
					}
					case "Color": {
						const block = newBlock("color");
						block.setFieldValue(getContent(node).replace("0x", "#").toLowerCase(), "COLOR");
						block.setShadow(true);
						break;
					}
					case "RandomColor": {
						newBlock("randomColor");
						break;
					}
					case "RGB": {
						const block = newBlock("rgb");
						const [r, g, b] = node.getChildren("Expression");

						connection = block.getInput("RED")!.connection;
						numberShadow(r);

						connection = block.getInput("GREEN")!.connection;
						numberShadow(g);

						connection = block.getInput("BLUE")!.connection;
						numberShadow(b);

						break;
					}
				}
			}

			parse(parser.parse(code).topNode);
		} catch (e) {
			console.error(e);
		}
		this.view!.destroy();
		this.container.remove();
		this.container.innerHTML = "";
	}
}
