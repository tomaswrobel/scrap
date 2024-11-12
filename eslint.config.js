import tseslint from "typescript-eslint";

export default tseslint.config(tseslint.configs.base, {
	languageOptions: {
		parserOptions: {
			projectService: true,
			tsconfigRootDir: import.meta.dirname,
		},
	},
	rules: {
		"@typescript-eslint/no-namespace": [
			"error",
			{
				allowDeclarations: true,
				allowDefinitionFiles: true,
			},
		],

		/**
		 * I use TypeScript not just for its types,
		 * but it is much more readable than JavaScript.
		 * 
		 * As other programming languages have member accessibilities,
		 * and their default is `private`, I want to enforce this rule
		 * to make my code more readable.
		 * 
		 * Because defaultly, TypeScript's member accessibilities are `public`.
		 * That makes sense, because it needs to be compatible with JavaScript.
		 */
		"@typescript-eslint/explicit-member-accessibility": [
			"error",
			{
				accessibility: "explicit",
				overrides: {
					constructors: "no-public",
				},
			},
		],

		/*
		 * Var is not block scoped, and that's the purpose.
		 * If I write:
		 * 
		 * ```ts
		 * if (true) {
		 *     var x = 1;
		 * } else {
		 *     var x = 2;
		 * }
		 * ```
		 * 
		 * I succesfully used `var` as it's intended to be used.
		 * It's just a technique not everyone likes, but it may 
		 * be more efficient than `let` if used correctly.
		 * 
		 * But I use `var` in for loops more often than in if statements.
		 * 
		 * Look at the code below:
		 * 
		 * ```ts
		 * function getUniqueName() {
		 * 	  for (var n = 1, name = "Scrappy"; this.entities.some(e => e.name === name); name = `Scrappy ${n++}`);
		 * 	  return name;
		 * }
		 * ```
		 * 
		 * Isn't that beautiful for loop? Note that my coding style is disgusting.
		 */
		"no-var": "off",

		"@typescript-eslint/consistent-type-exports": "error",
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
	},
	files: ["src/**/*.ts"],
	ignores: ["dist/", "node_modules/", "src-tauri/", ".parcel-cache/"],
});
