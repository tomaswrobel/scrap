/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview AOT plugins allow you to transform any file to Svelte components, by your way. You are given file's name, content and many more of its information, and returning the `vars`, a `$props()` alternative that'll be injected at compile time.
 * @copyright Tomáš Wróbel 2025
 */
import assert from "node:assert";
import type {LoadResult, PluginContext} from "rollup";
import type {Plugin} from "vite";
import {compile} from "svelte/compiler";
import {basename} from "node:path";
import {stripIndent} from "common-tags";

export interface AOTPluginContext {
	/**
	 * The path of the file that is being processed.
	 */
	id: string;

	/**
	 * The parameters extracted from the URL.
	 * (should include the `param` parameter set in the plugin options)
	 */
	parameters: URLSearchParams;
}

export interface AOTPluginOptions<T> {
	/**
	 * The name of the AOT component plugin, used for identification.
	 */
	name: string;
	/**
	 * The query parameter that triggers the  AOT component plugin. Does **not** include the leading `?`.
	 */
	param: string;
	/**
	 * The function that processes the original file content and optionally query parameters.
	 * It should return variables that will be injected into the Svelte component.
	 */
	getVariables(this: PluginContext, ctx: AOTPluginContext): T | Promise<T>;
	/**
	 * The path of the Svelte component that will be used as a template for the AOT component.
	 * Vite must be able to resolve it from anywhere, so use an alias or an absolute specifier.
	 *
	 * @example
	 * source: "/component/Comp.svelte"
	 */
	source: string;
}

export function createAOTComponentPlugin<T>({
	source,
	param,
	name,
	...hooks
}: AOTPluginOptions<T>): Plugin {
	const virtualFileNameSuffix = ".aot";
	const pathParamName = "__path";
	let dev = false;

	return {
		name,
		enforce: "pre",

		async load(id, opts): Promise<LoadResult> {
			const [filename, search] = id.split("?");

			if (!filename.endsWith(virtualFileNameSuffix)) {
				return;
			}

			const parameters = new URLSearchParams(search);

			if (!parameters.has(param)) {
				return;
			}

			const resolvedFilePath = parameters.get(pathParamName);
			assert.ok(resolvedFilePath, "Do not use virtual files directly.");

			parameters.delete(pathParamName);

			const code = stripIndent`
				<script>
					import AOT from "${source}";
					const props = $props();
				</script>

				<AOT
					{...props}
					vars={${JSON.stringify(
						await hooks.getVariables.call(this, {
							id: resolvedFilePath,
							parameters,
						}),
					)}}
				/>
			`;

			const {js, warnings} = compile(code, {
				generate: opts?.ssr ? "server" : "client",
				dev,
				filename,
				outputFilename: `${basename(filename)}.svelte`,
			});

			warnings.forEach(this.warn, this);

			return js;
		},

		async resolveId(source, importer, options): Promise<string | undefined> {
			const [filename, search] = source.split("?");

			if (!filename || !search) {
				return;
			}

			const parameters = new URLSearchParams(search);

			if (!parameters.has(param)) {
				return;
			}

			const resolved = await this.resolve(filename, importer, options);

			if (!resolved) {
				return;
			}

			parameters.set(pathParamName, resolved.id);
			return `${resolved.id}${virtualFileNameSuffix}?${parameters}`;
		},

		config(_, env): void {
			dev = env.command === "serve";
		},
	};
}
