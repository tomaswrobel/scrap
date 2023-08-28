import {defineConfig} from "vite";
import {lezer} from "@lezer/generator/rollup";
import {viteStaticCopy} from "vite-plugin-static-copy";

export default defineConfig({
	plugins: [
		lezer(),
		viteStaticCopy({
			targets: [{src: "node_modules/blockly/media", dest: "blockly"}],
		}),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"blockly": [
						"scrap-blocks",
						"blockly",
						"@blockly/continuous-toolbox",
					]
				},
			},
		},
	},
});
