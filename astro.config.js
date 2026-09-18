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
			alias: [
				// The bundler's resolution of @juvofy/lib's `svelte` export condition is
				// unreliable across multiple subpaths in the SSR build, so route straight
				// to the built files instead of relying on the package's `exports` map.
				{
					find: /^@juvofy\/lib\/components\/(.*\.svelte)$/,
					replacement: resolve(
						import.meta.dirname,
						"node_modules/@juvofy/lib/dist/components/$1",
					),
				},
				{
					find: "@scrap",
					replacement: resolve(import.meta.dirname, "./src"),
				},
				{
					find: "monaco-editor",
					replacement: resolve(
						import.meta.dirname,
						"node_modules/monaco-editor/esm/vs/editor/editor.main.js",
					),
				},
				{
					find: "@monaco-editor/worker",
					replacement: resolve(
						import.meta.dirname,
						"node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
					),
				},
				{
					find: "painterro",
					replacement: resolve(
						import.meta.dirname,
						"node_modules/painterro/js/main.js",
					),
				},
				{
					find: "path",
					replacement: "path-browserify",
				},
			],
		},
	},
});
