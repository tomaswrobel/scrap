import * as path from "node:path";
import {defineConfig} from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	clearScreen: false,
	publicDir: "node_modules/blockly/media",
	base: "./",
	server: {
		hmr: host
			? {
					host,
					port: 1421,
					protocol: "ws",
			  }
			: undefined,
		host: host || false,
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	resolve: {
		alias: {
			"@scrap": path.resolve(import.meta.dirname, "./src"),
		},
	},
});
