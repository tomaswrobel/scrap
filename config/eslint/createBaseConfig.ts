import type {Linter} from "eslint";
import sveltePlugin from "eslint-plugin-svelte";
import {defineConfig} from "eslint/config";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import {
	possibleProblemRules,
	suggestionRules,
	svelteConfigs,
	tsConfigs,
	tsExtensionRules,
	tsRules,
} from "./rules.ts";

export function createBaseConfig(dir: string, glob: "" | "**/" = "**/"): Linter.Config[] {
	const jsFiles = [`${dir}/${glob}*.js`, `${dir}/${glob}*.mjs`];
	const tsFiles = [`${dir}/${glob}*.ts`, `${dir}/${glob}*.mts`];
	const configFiles = [`${dir}/config/${glob}*.ts`, `${dir}/${glob}*.config.mjs`];
	const svelteFiles = [`${dir}/${glob}*.svelte`, `${dir}/${glob}*.svelte.ts`];

	const defaultTsParserOptions: Partial<Linter.ParserOptions> = {
		ecmaFeatures: {
			modules: true,
		},
		ecmaVersion: 2023,
		extraFileExtensions: [".svelte", ".svelte.ts"],
		projectService: true,
		sourceType: "module",
		tsconfigRootDir: process.cwd(),
	};

	const configs = defineConfig([
		{
			files: [...jsFiles, ...tsFiles],
			plugins: {
				"@typescript-eslint": tseslint.plugin,
			},
			languageOptions: {
				parser: tseslint.parser,
				parserOptions: defaultTsParserOptions,
			},
			extends: [tsConfigs],
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...tsExtensionRules,
				...tsRules,
			},
		},
		{
			files: configFiles,
			plugins: {
				"@typescript-eslint": tseslint.plugin,
			},
			languageOptions: {
				parser: tseslint.parser,
				parserOptions: defaultTsParserOptions,
			},
			extends: tsConfigs,
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...tsExtensionRules,
				...tsRules,
			},
		},
		{
			files: jsFiles,
			rules: {
				"@typescript-eslint/explicit-function-return-type": "off",
				"@typescript-eslint/explicit-module-boundary-types": "off",
			},
		},
		{
			files: svelteFiles,
			plugins: {
				"@typescript-eslint": tseslint.plugin,
				"svelte": sveltePlugin,
			},
			languageOptions: {
				parser: svelteParser,
				parserOptions: {
					...defaultTsParserOptions,
					parser: tseslint.parser,
					svelteFeatures: {
						runes: true,
					},
				},
			},
			extends: [...tsConfigs, ...svelteConfigs],
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...tsExtensionRules,
				...tsRules,
			},
			settings: {
				svelte: {
					ignoreWarnings: [
						// ESLint gets confused about types from parameters of snippets.
						"@typescript-eslint/restrict-plus-operands",
						"@typescript-eslint/no-unsafe-assignment",
						"@typescript-eslint/no-unsafe-member-access",
						"@typescript-eslint/no-unsafe-argument",
						"@typescript-eslint/no-unsafe-call",
						// https://github.com/sveltejs/svelte-eslint-parser/issues/657
						"@typescript-eslint/no-confusing-void-expression",
					],
				},
			},
		},
		{ignores: [`${dir}/.*/**/*`]},
	]);
	return configs;
}
