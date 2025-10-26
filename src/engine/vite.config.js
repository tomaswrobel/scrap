import {resolve} from "node:path";
import {defineConfig} from "vite";

export default defineConfig({
	resolve: {
		alias: {
			"@scrap": resolve(import.meta.dirname, ".."),
		},
	},
	esbuild: {
		target: "ES2024",
	},
	publicDir: false,
	build: {
		outDir: resolve(import.meta.dirname, "../../public/engine"),
		lib: {
			entry: [resolve(import.meta.dirname, "./index.ts")],
			fileName(_format, entryName) {
				return `${entryName}.js`;
			},
			cssFileName: "index",
			formats: ["iife"],
			name: "ScrapEngine",
		},
	},
});
