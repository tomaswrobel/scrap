import { vitePreprocess, type SvelteConfig } from "@sveltejs/vite-plugin-svelte";

const config: SvelteConfig = {
	// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
	// for more information about preprocessors
	preprocess: vitePreprocess({
		script: true,
		style: true,
	}),
};

export default config;
