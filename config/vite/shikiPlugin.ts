import {readFile} from "fs/promises";
import {basename} from "path";
import {codeToHtml} from "shiki";
import type {Plugin} from "vite";
import type {Props} from "../../src/components/AOTCode.svelte";
import {createAOTComponentPlugin} from "./createAOTComponentPlugin";
import {resolveShikiLanguage} from "./resolveShikiLanguage";

export function shikiPlugin(): Plugin {
	return createAOTComponentPlugin({
		name: "svelte-shiki-plugin",
		param: "shiki",
		source: "/src/components/aot/AOTCode.svelte",
		async getVariables(ctx): Promise<Props["vars"]> {
			const theme = ctx.parameters.get("theme") ?? "github-dark-default";
			const code = await readFile(ctx.id, "utf-8");

			return {
				raw: await codeToHtml(code, {
					lang: resolveShikiLanguage(ctx.id),
					theme,
				}),
				filename: basename(ctx.id),
			};
		},
	});
}
