import tailwindcss from "@tailwindcss/vite";
import {resolve} from "node:path";
import {defineConfig} from "astro/config";
import {shikiPlugin} from "@juvofy/lib/vite/shikiPlugin";
import {svgPlugin} from "@juvofy/lib/vite/svgPlugin";
import wasm from "vite-plugin-wasm";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";

export default defineConfig({
	adapter: vercel(),
	integrations: [svelte()],
	vite: {
		plugins: [wasm(), tailwindcss(), shikiPlugin(), svgPlugin("icon")],
		resolve: {
			alias: {
				"@scrap": resolve(import.meta.dirname, "./src"),
				"monaco-editor": resolve(
					import.meta.dirname,
					"node_modules/monaco-editor/esm/vs/editor/editor.main.js",
				),
				"@monaco-editor/worker": resolve(
					import.meta.dirname,
					"node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
				),
				"path": "path-browserify",
			},
		},
		esbuild: {
			target: "ES2024",
		},
	},
});
