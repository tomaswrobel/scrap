import type {Linter} from "eslint";
import * as sveltePlugin from "eslint-plugin-svelte";
import {defineConfig} from "eslint/config";
import * as tseslint from "typescript-eslint";

export const possibleProblemRules: Linter.RulesRecord = {
	"array-callback-return": "error",
	"no-constant-binary-expression": "error",
	"no-constructor-return": "error",
	"no-new-native-nonconstructor": "error",
	"no-promise-executor-return": "error",
	"no-self-compare": "error",
	"no-template-curly-in-string": "warn",
	"no-unmodified-loop-condition": "error",
	"no-unreachable-loop": "error",
	"no-unused-private-class-members": "warn",
	"no-unused-vars": [
		"warn",
		{
			argsIgnorePattern: "^_",
			varsIgnorePattern: "^_",
		},
	],
	"require-atomic-updates": "error",
};

export const suggestionRules: Linter.RulesRecord = {
	"curly": "error",
	"eqeqeq": "error",
	"no-bitwise": "error",
	"no-empty-static-block": "error",
	"no-eval": "error",
	"no-extra-bind": "error",
	"no-extra-label": "error",
	"no-implicit-coercion": "error",
	"no-labels": "error",
	"no-loop-func": "error",
	"no-new": "error",
	"no-new-func": "error",
	"no-new-object": "error",
	"no-new-wrappers": "error",
	"no-return-assign": "error",
	"no-sequences": "error",
	"no-unneeded-ternary": "error",
	"no-unused-expressions": "error",
	"no-useless-call": "error",
	"no-useless-computed-key": "error",
	"no-useless-concat": "error",
	"no-useless-rename": "error",
	"no-useless-return": "error",
	"no-var": "off",
	"no-warning-comments": "warn",
	"object-shorthand": "error",
	"prefer-const": ["error", {destructuring: "all"}],
	"prefer-destructuring": "error",
	"prefer-exponentiation-operator": "error",
	"prefer-numeric-literals": "error",
	"prefer-object-has-own": "error",
	"prefer-object-spread": "error",
	"prefer-promise-reject-errors": "error",
	"prefer-regex-literals": "error",
	"prefer-rest-params": "error",
	"prefer-spread": "error",
	"prefer-template": "error",
	"symbol-description": "error",
	"spaced-comment": ["error", "always", {markers: ["/"]}],
};

export const tsRules: Linter.RulesRecord = {
	"@typescript-eslint/consistent-type-exports": "error",
	"@typescript-eslint/consistent-type-imports": "error",
	"@typescript-eslint/explicit-function-return-type": "off",
	"@typescript-eslint/explicit-member-accessibility": [
		"error",
		{
			accessibility: "explicit",
			overrides: {
				accessors: "off",
				constructors: "off",
				methods: "explicit",
				properties: "explicit",
				parameterProperties: "explicit",
			},
		},
	],
	"@typescript-eslint/method-signature-style": ["error", "method"],
	"@typescript-eslint/no-import-type-side-effects": "error",
	"@typescript-eslint/no-require-imports": "error",
	"@typescript-eslint/no-unnecessary-qualifier": "error",
	"@typescript-eslint/no-useless-empty-export": "error",
	"@typescript-eslint/prefer-readonly": "error",
	"@typescript-eslint/require-array-sort-compare": "error",
	"@typescript-eslint/require-await": "warn",
	"@typescript-eslint/switch-exhaustiveness-check": "error",
	"@typescript-eslint/no-namespace": ["error", {allowDeclarations: true}],
	"@typescript-eslint/no-misused-promises": "error",
};

export const tsExtensionRules: Linter.RulesRecord = {
	"@typescript-eslint/no-invalid-this": "error",
	"@typescript-eslint/no-invalid-void-type": [
		"error",
		{
			allowAsThisParameter: true,
			allowInGenericTypeArguments: true,
		},
	],
	"@typescript-eslint/no-loop-func": "error",
	"@typescript-eslint/no-unused-expressions": "error",
	"no-unused-vars": "off",
	"@typescript-eslint/no-unused-vars": [
		"warn",
		{
			argsIgnorePattern: "^_",
			varsIgnorePattern: "^_",
		},
	],
	"@typescript-eslint/triple-slash-reference": "off",
	"@typescript-eslint/restrict-template-expressions": "off",
	"@typescript-eslint/no-unsafe-assignment": "off",
	"@typescript-eslint/no-unsafe-return": "off",
	"@typescript-eslint/no-confusing-void-expression": "off",
};

export const tsConfigs = defineConfig([
	tseslint.configs.eslintRecommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
]);

export const svelteConfigs = defineConfig([
	...sveltePlugin.configs.base,
	...sveltePlugin.configs.prettier,
	...sveltePlugin.configs.recommended,
]);
