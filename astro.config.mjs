// @ts-check
import {defineConfig} from "astro/config";
import vercel from "@astrojs/vercel";
import path from "node:path";

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	vite: {
		resolve: {
			alias: [
				{
					find: "@scrap",
					replacement: path.resolve(import.meta.dirname, "../src"),
				},
			],
		},
	},
});
