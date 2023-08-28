import * as Blockly from "scrap-blocks";
import Component from "../tab";
import type {SyntaxNode} from "@lezer/common";
import {type Entity} from "../entities";
import {snippetCompletion, type CompletionContext} from "@codemirror/autocomplete";
import {EditorState} from "@codemirror/state";
import {EditorView, basicSetup} from "codemirror";
import {LanguageSupport, syntaxTree, LRLanguage} from "@codemirror/language";
import {parser} from "./js.grammar";
import {styleTags, tags as t} from "@lezer/highlight";

const javaScriptSubset = parser.configure({
	props: [
		styleTags({
			VariableDefinition: t.variableName,
			Number: t.number,
			String: t.string,
			Boolean: t.bool,
			keyword: t.keyword,
			'"{" "}"': t.brace,
			'"(" ")"': t.paren,
			'"[" "]"': t.squareBracket,
			"Identifier Property": t.propertyName,
		}),
	],
});

const javascriptLanguage = LRLanguage.define({
	parser: javaScriptSubset,
	languageData: {
		commentTokens: {line: "//", block: {open: "/*", close: "*/"}},
	},
});

const generator = new Blockly.Scrap.Generator();

export default class Code implements Component {
	container = document.createElement("div");
	view?: EditorView;
	entity!: Entity;

	constructor() {
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
				extensions: [
					basicSetup,
					new LanguageSupport(javascriptLanguage),
					javascriptLanguage.data.of({
						autocomplete: (context: CompletionContext) => {
							let word = context.matchBefore(/\w*/)!;
							if (context.matchBefore(/this\./)) {
								return {
									from: word.from,
									options: [
										{label: "match", type: "keyword"},
										{label: "hello", type: "variable", info: "(World)"},
										{label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"},
									],
									validFor: /^this\.$/,
								};
							}
							return {
								from: word.from,
								options: [
									{label: "this", type: "keyword"},
									{label: "continue", type: "keyword"},
									{label: "break", type: "keyword"},
									snippetCompletion("while (#{false}) {\n\t#{}\n}", {
										label: "while",
										type: "keyword",
									}),
								],
							};
						},
					}),
				],
			})
		);
	}

	dispose(other: Entity[]) {
		try {
			const code = this.view!.state.doc.toString();
			const workspace = this.entity.codeWorkspace;
			workspace.clear();

			let connection: Blockly.Connection | null = null;

			function newBlock(type: string) {
				const block = workspace.newBlock(type);

				if (connection) {
					if (block.outputConnection) {
						connection.connect(block.outputConnection);
					} else if (block.previousConnection) {
						connection.connect(block.previousConnection);
					}
				}

				return block;
			}

			function getContent(node: SyntaxNode) {
				return code.slice(node.from, node.to);
			}

			function parse(node: SyntaxNode) {
				switch (node.name) {
					case "ThrowStatement":
						connection = newBlock("throw").getInput("ERROR")!.connection;
						parse(node.getChild("Expression")!);
						break;
					case "ReturnStatement": {
						const block = newBlock("procedures_ifreturn");

						const trueBlock = newBlock("logic_boolean");
						trueBlock.setFieldValue("TRUE", "BOOL");

						trueBlock.outputConnection!.connect(block.getInput("CONDITION")!.connection!);

						connection = block.getInput("VALUE")!.connection;
						parse(node.getChild("Expression")!);
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
					case "Statement":
					case "Expression":
						parse(node.firstChild!);
						break;
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
						const block = newBlock("math_number");
						block.setFieldValue(getContent(node), "NUM");
						block.setShadow(true);
						break;
					}
					case "String": {
						const block = newBlock("iterables_string");
						block.setFieldValue(JSON.parse(getContent(node)), "TEXT");
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
					case "ForStatement": {
						const block = newBlock("repeat");
						connection = block.getInput("TIMES")!.connection;
						parse(node.getChild("Expression")!);
						connection = block.getInput("STACK")!.connection;
						parse(node.getChild("Block")!);
						connection = block.nextConnection;
						break;
					}
					case "BreakStatement": {
						newBlock("break");
						break;
					}
					case "ContinueStatement": {
						newBlock("continue");
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

						if (other.some(entity => entity.name === content)) {
							const block = newBlock("sprite");
							block.setFieldValue(content, "SPRITE");
							block.setShadow(true);
						} else {
							const block = newBlock("parameter");
							block.setFieldValue(content, "VAR");
						}
						break;
					}
				}
			}

			parse(syntaxTree(this.view!.state).topNode);
		} catch (e) {
			console.error(e);
		}
		this.view!.destroy();
		this.container.remove();
		this.container.innerHTML = "";
	}
}
