import * as SvelteVitePlugin from "@sveltejs/vite-plugin-svelte";

/** @type {SvelteVitePlugin.SvelteConfig} */
const config = {
	preprocess: SvelteVitePlugin.vitePreprocess({
		script: true,
		style: true,
	}),
};

export default config;
