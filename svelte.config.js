import * as VitePlugin from "@sveltejs/vite-plugin-svelte";

/** @type {VitePlugin.SvelteConfig} */
const config = {
	preprocess: VitePlugin.vitePreprocess({
		script: true,
		style: true,
	}),
};

export default config;
