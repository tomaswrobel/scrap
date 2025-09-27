import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { shikiPlugin } from "./config/vite/shikiPlugin";
import { svgPlugin } from "./config/vite/svgPlugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), svelte(), shikiPlugin(), svgPlugin("icon")],
	resolve: {
		alias: {
			$context: resolve(import.meta.dirname, "./src/lib/Context.ts"),
			"@scrap": resolve(import.meta.dirname, "./src")
		},
	},
	esbuild: {
		target: "ES2024"
	}
});
