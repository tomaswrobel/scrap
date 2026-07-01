/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Vite config used when bundling engine
 * @copyright Tomáš Wróbel 2025
 */
import {resolve} from "node:path";
import {defineConfig} from "vite";

export default defineConfig({
	resolve: {
		alias: {
			"@scrap": resolve(import.meta.dirname, ".."),
		},
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
