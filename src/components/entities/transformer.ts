export default async function transform(code: string) {
	const babel = await import("@babel/core");

	return (await babel.transformAsync(code, {
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
							if (path.node.callee.type === "Identifier") {
								if (path.node.callee.name === "String") {
									return;
								}

								path.node.callee = babel.types.memberExpression(
									path.node.callee,
									babel.types.identifier("call")
								);

								path.node.arguments.unshift(babel.types.thisExpression());
							}

							path.replaceWith(babel.types.awaitExpression(path.node));
						}
					},
					ForOfStatement(path) {
						path.node.await = true;
					}
				},
			},
		],
		sourceMaps: true,
	}))!;
}
