export default async function transform(code: string) {
	const babel = await import("@babel/core");

	return (await babel.transformAsync(code, {
		plugins: [
			{
				name: "babel-plugin-transform-scrap-async",
				visitor: {
					FunctionDeclaration(path) {
						if (!path.node.generator) {
							path.node.async = true;
						}

						if (path.node.async) {
							return;
						}

						path.node.async = true;

						path.replaceWith(
							babel.types.functionDeclaration(
								babel.types.identifier(path.node.id!.name),
								[babel.types.restElement(babel.types.identifier("args"))],
								babel.types.blockStatement([
									babel.types.variableDeclaration("const", [
										babel.types.variableDeclarator(babel.types.identifier("result"), babel.types.arrayExpression([])),
									]),
									path.node,
									babel.types.forOfStatement(
										babel.types.variableDeclaration("const", [babel.types.variableDeclarator(babel.types.identifier("value"))]),
										babel.types.callExpression(
											babel.types.memberExpression(babel.types.identifier(path.node.id!.name), babel.types.identifier("apply")),
											[babel.types.thisExpression(), babel.types.identifier("args")]
										),
										babel.types.blockStatement([
											babel.types.expressionStatement(
												babel.types.callExpression(
													babel.types.memberExpression(babel.types.identifier("result"), babel.types.identifier("push")),
													[babel.types.identifier("value")]
												)
											),
										])
									),
									babel.types.returnStatement(babel.types.identifier("result")),
								])
							)
						);
					},
					FunctionExpression(path) {
						path.node.async = true;
					},
					ImportDeclaration(path) {
						path.remove();
					},
					CallExpression(path) {
						if (path.parent.type !== "AwaitExpression" && path.node.arguments.every(a => a.type !== "FunctionExpression")) {
							if (path.node.callee.type === "Identifier") {
								if (path.node.callee.name === "String") {
									return;
								}

								path.node.callee = babel.types.memberExpression(path.node.callee, babel.types.identifier("call"));

								path.node.arguments.unshift(babel.types.thisExpression());
							}

							path.replaceWith(babel.types.awaitExpression(path.node));
						}
					},
				},
			},
		],
		sourceMaps: true,
	}))!;
}
