import {parse} from "doctrine";
import {Types} from "../blockly";
import {checkForScope, escape, unescape} from "./utils";

/**
 * Transform ScrapScript code to JavaScript.
 * Specifically, this function:
 * * Adds `async` to all functions
 * * Adds `await` to all function calls
 * * Adds loop protection to `while` and `for` loops
 * * Adds `this.declareVariable` to all variable declarations
 * * Adds `this.setVariable` to all variable assignments
 * * Adds `this.changeVariable` to all variable assignments
 * * Adds `this.getVariable` to all variable references
 * * Makes sure `Scrap.StopError` cannot be caught
 * Uses Babel to transform the code.
 * @param code The ScrapScript code to transform
 * @param minified Shall the code be minified?
 * @returns Valid JavaScript code
 */
export default async function transform(code: string, minified = false) {
	const babel = await import("@babel/core");
	const variables = new Set<string>();
	await window.app.setGlobalVariables();

	return babel.transformAsync(code, {
		minified,
		plugins: [
			{
				name: "babel-plugin-transform-scrap-async",
				visitor: {
					TaggedTemplateExpression(path) {
						if (
							path.node.quasi.expressions.length === 0
							&& path.node.tag.type === "Identifier"
							&& path.node.tag.name === "sprite"
						) {
							path.replaceWith(
								babel.types.identifier(
									escape(
										path.node.quasi.quasis[0].value.raw
									)
								)
							);
						}
					},
					FunctionDeclaration(path) {
						path.node.async = true;
					},
					FunctionExpression(path) {
						path.node.async = true;
					},
					CallExpression(path) {
						if (path.parent.type !== "AwaitExpression") {
							// If this is a user-defined function, we need to bind `this` to it
							if (path.node.callee.type === "Identifier" && path.node.callee.name !== "String" && path.node.callee.name !== "Number") {
								path.node.callee = babel.types.memberExpression(path.node.callee, babel.types.identifier("call"));
								path.node.arguments.unshift(babel.types.thisExpression());
							}

							path.replaceWith(babel.types.awaitExpression(path.node));
						}
					},
					// Endless loop protection
					WhileStatement(path) {
						if (path.node.body.type === "BlockStatement") {
							path.node.body.body.unshift(
								babel.types.expressionStatement(
									babel.types.awaitExpression(
										babel.types.newExpression(
											babel.types.identifier("Promise"),
											[
												babel.types.memberExpression(
													babel.types.identifier("Scrap"),
													babel.types.identifier("loop")
												),
											]
										)
									)
								)
							);
						}
					},
					ForStatement(path) {
						if (path.node.body.type === "BlockStatement") {
							path.node.body.body.unshift(
								babel.types.expressionStatement(
									babel.types.awaitExpression(
										babel.types.newExpression(
											babel.types.identifier("Promise"),
											[
												babel.types.memberExpression(
													babel.types.identifier("Scrap"),
													babel.types.identifier("loop")
												),
											]
										)
									)
								)
							);
						}
					},
					ForOfStatement(path) {
						if (path.node.body.type === "BlockStatement") {
							path.node.body.body.unshift(
								babel.types.expressionStatement(
									babel.types.awaitExpression(
										babel.types.newExpression(
											babel.types.identifier("Promise"),
											[
												babel.types.memberExpression(
													babel.types.identifier("Scrap"),
													babel.types.identifier("loop")
												),
											]
										)
									)
								)
							);
						}
					},
					// Scrap.StopError cannot be caught
					CatchClause(path) {
						if (!path.node.param) {
							path.node.param = babel.types.identifier("e");
						}

						path.node.body.body.unshift(
							babel.types.ifStatement(
								babel.types.binaryExpression(
									"instanceof",
									path.node.param as babel.types.Identifier,
									babel.types.memberExpression(
										babel.types.identifier("Scrap"),
										babel.types.identifier("StopError")
									)
								),
								babel.types.throwStatement(
									babel.types.identifier("e")
								),
							),
						);
					},
					// Variables with `let` or `var` are converted to `this.declareVariable`
					VariableDeclaration(path) {
						if (path.parent.type === "ForOfStatement" || path.parent.type === "ForStatement") {
							return;
						}
						if (path.node.kind === "let" || path.node.kind === "var") {
							let varType = "";

							if (path.node.leadingComments) {
								for (const {type, value} of path.node.leadingComments) {
									if (type === "CommentBlock") {
										const parsed = parse(`/*${value}*/`, {unwrap: true, tags: ["type"], recoverable: true});

										if (parsed.tags.length) {
											for (const {title, type} of parsed.tags) {
												if (title === "type" && type!.type === "NameExpression") {
													if (Types.indexOf(type!.name) > -1) {
														varType = type!.name;
													}
												}
											}
										}
									}
								}
							}

							const declarations = path.node.declarations.map((declaration) => {
								if (declaration.id.type !== "Identifier") {
									return babel.types.emptyStatement();
								}
								variables.add(declaration.id.name);
								return babel.types.expressionStatement(
									babel.types.callExpression(
										babel.types.memberExpression(
											babel.types.thisExpression(),
											babel.types.identifier("declareVariable")
										),
										[
											babel.types.stringLiteral(unescape(declaration.id.name)),
											babel.types.stringLiteral(varType || "Any"),
										]
									)
								);
							});

							path.replaceWithMultiple(declarations);
						}
					},
					AssignmentExpression(path) {
						if (path.node.left.type === "Identifier") {
							if (path.node.operator === "-=") {
								var right: babel.types.Expression = babel.types.unaryExpression("-", path.node.right);
							} else if (path.node.operator === "+=" || path.node.operator === "=") {
								var right: babel.types.Expression = path.node.right;
							} else {
								return;
							}
							if (variables.has(path.node.left.name)) {
								var target: babel.types.Expression = babel.types.thisExpression();
							} else {
								var target: babel.types.Expression = babel.types.memberExpression(
									babel.types.thisExpression(),
									babel.types.identifier("stage")
								);
							}
							path.replaceWith(
								babel.types.callExpression(
									babel.types.memberExpression(
										target,
										babel.types.identifier(path.node.operator === "=" ? "setVariable" : "changeVariable")
									),
									[
										babel.types.stringLiteral(unescape(path.node.left.name)),
										right,
									]
								)
							);
						}
					},
					Identifier(path) {
						if (variables.has(path.node.name)) {
							if (checkForScope(path)) {
								return;
							}

							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											babel.types.thisExpression(),
											babel.types.identifier("getVariable")
										),
										[
											babel.types.stringLiteral(unescape(path.node.name)),
										]
									)
								)
							);
						} else if (window.app.globalVariables.some(([e]) => escape(e) === path.node.name)) {
							if (checkForScope(path)) {
								return;
							}

							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											babel.types.memberExpression(
												babel.types.thisExpression(),
												babel.types.identifier("stage")
											),
											babel.types.identifier("getVariable")
										),
										[
											babel.types.stringLiteral(unescape(path.node.name)),
										]
									)
								)
							);
						}
					},
				},
			},
		],
	});
}
