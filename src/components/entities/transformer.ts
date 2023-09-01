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
							path.replaceWith(babel.types.awaitExpression(path.node));
						}
					},
				},
			},
		],
		sourceMaps: true,
	}))!;
}
