import type {types} from "@babel/core";
import {getPropertyContents, getType, isProperty} from "./utils";

/**
 * Transform ScrapScript code to JavaScript.
 * Specifically, this function:
 * *
 * * Adds `async` to all function declarations
 * * Adds `await` to all function calls
 * * Adds loop protection to `while` and `for` loops
 * * Adds `self.declareVariable` to all variable declarations
 * * Adds `self.setVariable` to all variable assignments
 * * Adds `self.getVariable` to all variable references
 * * Adds other setters:
 * 		* `
 * * Makes sure `Scrap.StopError` cannot be caught
 * 
 * Uses Babel to transform the code.
 * @param code The ScrapScript code to transform
 * @returns Valid JavaScript code
 */
export default async function transform(code: string) {
	const babel = await import("@babel/core");

	return babel.transformAsync(code, {
		filename: "script.ts",
		presets: [
			await import("@babel/preset-typescript")
		],
		plugins: [
			{
				name: "babel-plugin-transform-scrapscript-syntax",
				visitor: {
					TSInterfaceDeclaration(path) {
						if (path.node.id.name === "Variables") {
							path.replaceWithMultiple(
								path.node.body.body.map((node) => {
									if (node.type === "TSPropertySignature") {
										const type = getType(node.typeAnnotation?.typeAnnotation);
										const check = (new Array<string>()).concat(type);

										if (node.key.type !== "Identifier" && node.key.type !== "StringLiteral") {
											return babel.types.emptyStatement();
										}

										return babel.types.expressionStatement(
											babel.types.callExpression(
												babel.types.memberExpression(
													babel.types.identifier("self"),
													babel.types.identifier("declareVariable")
												),
												[
													babel.types.stringLiteral(getPropertyContents(node.key)),
													...check.map((t) => babel.types.stringLiteral(t))
												]
											)
										);
									}

									return babel.types.emptyStatement();
								})
							);
						}
					},
					FunctionDeclaration(path) {
						path.node.async = true;
						path.node.params.unshift(babel.types.identifier("self"));
					},
					FunctionExpression(path) {
						path.node.async = true;
						path.node.params.unshift(babel.types.identifier("self"));
					},
					ArrowFunctionExpression(path) {
						path.node.async = true;
						path.node.params.unshift(babel.types.identifier("self"));
					},
					CallExpression(path) {
						if (path.parent.type !== "AwaitExpression") {
							// If this is a user-defined function, we need to bind `self` to it
							if (path.node.callee.type === "Identifier" && path.node.callee.name !== "String" && path.node.callee.name !== "Number") {
								path.node.arguments.unshift(babel.types.identifier("self"));
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
					DoWhileStatement(path) {
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
					AssignmentExpression(path) {
						if (path.node.left.type !== "MemberExpression") {
							return;
						}

						switch (path.node.operator) {
							case "=": {
								var base = "set";
								var argument = path.node.right;
								break;
							}
							default: {
								var base = "set";
								var argument: types.Expression = babel.types.binaryExpression(
									path.node.operator.slice(0, -1) as types.BinaryExpression["operator"],
									path.node.left,
									path.node.right
								);
							}
						}

						if (path.node.left.object.type === "MemberExpression") {
							if (path.node.left.property.type === "Identifier" || path.node.left.property.type === "StringLiteral") {
								const string = path.node.left.property.type === "StringLiteral"
									? path.node.left.property
									: babel.types.stringLiteral(path.node.left.property.name)
									;

								if (isProperty(path.node.left.object, "variables")) {
									path.replaceWith(
										babel.types.awaitExpression(
											babel.types.callExpression(
												babel.types.memberExpression(
													path.node.left.object.object,
													babel.types.identifier(base + "Variable")
												),
												[
													string,
													argument
												]
											)
										)
									);
								} else if (isProperty(path.node.left.object, "effects")) {
									path.replaceWith(
										babel.types.awaitExpression(
											babel.types.callExpression(
												babel.types.memberExpression(
													path.node.left.object.object,
													babel.types.identifier(base + "Effect")
												),
												[
													string,
													argument
												]
											)
										)
									);
								}
							}
						} else if (isProperty(path.node.left, "x")) {
							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.left.object,
											babel.types.identifier(base + "X")
										),
										[argument]
									)
								)
							);
						} else if (isProperty(path.node.left, "y")) {
							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.left.object,
											babel.types.identifier(base + "Y")
										),
										[argument]
									)
								)
							);
						} else if (isProperty(path.node.left, "direction")) {
							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.left.object,
											babel.types.identifier(base === "set" ? "pointInDirection" : "turnLeft")
										),
										[argument]
									)
								)
							);
						} else if (isProperty(path.node.left, "volume")) {
							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.left.object,
											babel.types.identifier(base + "Volume")
										),
										[argument]
									)
								)
							);
						} else if (isProperty(path.node.left, "draggable")) {
							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.left.object,
											babel.types.identifier("setDraggable")
										),
										[argument]
									)
								)
							);
						}
					},
					MemberExpression(path) {
						if (path.node.object.type === "MemberExpression" && isProperty(path.node.object, "variables")) {
							if (path.node.property.type === "StringLiteral") {
								var string = path.node.property;
							} else if (path.node.property.type === "Identifier") {
								var string = babel.types.stringLiteral(path.node.property.name);
							} else {
								path.addComment("leading", "Cannot transform?", true);
								return;
							}

							path.replaceWith(
								babel.types.awaitExpression(
									babel.types.callExpression(
										babel.types.memberExpression(
											path.node.object.object,
											babel.types.identifier("getVariable")
										),
										[string]
									)
								)
							);
						}
					}
				},
			},
		],
	});
}
