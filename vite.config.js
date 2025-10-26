import {svelte} from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import {resolve} from "node:path";
import {defineConfig} from "vite";
import {shikiPlugin} from "./config/vite/shikiPlugin";
import {svgPlugin} from "./config/vite/svgPlugin";
import wasm from "vite-plugin-wasm";

export default defineConfig({
	plugins: [wasm(), tailwindcss(), svelte(), shikiPlugin(), svgPlugin("icon")],
	resolve: {
		alias: {
			"$context": resolve(import.meta.dirname, "./src/utils/Context.ts"),
			"@scrap": resolve(import.meta.dirname, "./src"),
			"path": "path-browserify",
		},
	},
	esbuild: {
		target: "ES2024",
	},
});
