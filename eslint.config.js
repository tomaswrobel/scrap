/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2024
 * @fileoverview ESLint configuration file.
 */
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config({
	languageOptions: {
		parser: tseslint.parser,
		parserOptions: {
			projectService: true,
			tsconfigRootDir: ".",
		},
	},
	plugins: {
		"@typescript-eslint": tseslint.plugin,
	},
	extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
	rules: {
		"@typescript-eslint/no-namespace": [
			"error",
			{
				allowDeclarations: true,
				allowDefinitionFiles: true,
			},
		],
		"@typescript-eslint/explicit-member-accessibility": [
			"error",
			{
				accessibility: "explicit",
				overrides: {
					constructors: "no-public",
				},
			},
		],
		"@typescript-eslint/consistent-type-assertions": [
			"error",
			{
				assertionStyle: "as",
			},
		],
		"@typescript-eslint/no-explicit-any": [
			"error",
			{
				ignoreRestArgs: true,
				fixToUnknown: true,
			},
		],
		"@typescript-eslint/consistent-type-imports": [
			"error",
			{
				disallowTypeAnnotations: false,
			},
		],
		"@typescript-eslint/dot-notation": "error",
		"@typescript-eslint/no-unused-vars": ["error", {args: "none"}],

		// These rules are for people
		// who don't know JavaScript well.
		"no-var": "off",
		"require-yield": "off",
		"prefer-template": "error",
		"@typescript-eslint/no-require-imports": "off",
		"@typescript-eslint/no-empty-object-type": "off",
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
	},
	ignores: ["./src/typings/**/*.ts", "*.js"],
	files: ["**/*.ts"],
});
