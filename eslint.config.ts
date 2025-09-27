import sveltePlugin from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import { createBaseConfig } from "./config/eslint/createBaseConfig";

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

export default defineConfig([
	globalIgnores(["./src/typings"]),
	...createBaseConfig(".")
]);
