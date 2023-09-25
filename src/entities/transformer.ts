export default async function transform(code: string, minified = false) {
	const babel = await import("@babel/core");

	return (await babel.transformAsync(code, {
		minified,
		plugins: [
			{
				name: "babel-plugin-transform-scrap-async",
				visitor: {
					FunctionDeclaration(path) {
						path.node.async = true;
					},
					FunctionExpression(path) {
						path.node.async = true;
					},
					CallExpression(path) {
						if (path.parent.type !== "AwaitExpression") {
							// If this is a user-defined function, we need to bind `this` to it
							if (path.node.callee.type === "Identifier" && path.node.callee.name !== "String") {
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
												babel.types.identifier("setTimeout"),
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
												babel.types.identifier("setTimeout"),
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
									babel.types.identifier("e"),
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
					}
				},
			},
		],
	}))!;
}
